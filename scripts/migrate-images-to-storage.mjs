import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BUCKET_NAME = 'product-images';
const BACKUP_FILE = path.join(ROOT_DIR, 'products_base64_backup.json');
const FETCH_BATCH_SIZE = 10;

function loadEnvFiles() {
  const envVars = {};
  for (const fileName of ['.env', '.env.local']) {
    const filePath = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  }
  return { ...envVars, ...process.env };
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const trimmed = dataUrl.trim();
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(trimmed);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const base64Body = match[2].replace(/\s+/g, '');
  const buffer = Buffer.from(base64Body, 'base64');
  if (!buffer || buffer.length === 0) return null;

  const extMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif'
  };
  const ext = extMap[mimeType] || mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  return { mimeType, ext, buffer };
}

function isBase64Image(value) {
  return typeof value === 'string' && value.trim().startsWith('data:image/') && value.includes(';base64,');
}

async function verifyPublicUrlOk(url) {
  let res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  if (res.status === 405 || res.status === 400) {
    res = await fetch(url, { method: 'GET', cache: 'no-store' });
  }
  if (!res.ok) {
    throw new Error(`Public URL verification failed (${res.status}) for ${url}`);
  }
}

async function createWorkingClient(supabaseUrl, env) {
  const candidates = [
    { label: 'SUPABASE_SERVICE_ROLE_KEY', key: env.SUPABASE_SERVICE_ROLE_KEY },
    { label: 'VITE_SUPABASE_SECRET_KEY', key: env.VITE_SUPABASE_SECRET_KEY },
    { label: 'VITE_SUPABASE_ANON_KEY', key: env.VITE_SUPABASE_ANON_KEY }
  ].filter((c) => c.key && typeof c.key === 'string' && c.key.trim().length > 0);

  for (const candidate of candidates) {
    const client = createClient(supabaseUrl, candidate.key.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await client.from('products').select('id', { count: 'exact', head: true });
    if (!error) {
      console.log(`Conectado ao Supabase usando ${candidate.label}.`);
      return { client, keyType: candidate.label };
    }
    console.warn(`Chave ${candidate.label} falhou no teste de conexão:`, error.message || error);
  }

  throw new Error('Nenhuma chave válida do Supabase foi encontrada no ambiente (.env / .env.local).');
}

async function ensureBucketReady(client) {
  const { data: bucket, error: getErr } = await client.storage.getBucket(BUCKET_NAME);
  if (!getErr && bucket) {
    console.log(`Bucket '${BUCKET_NAME}' encontrado (public=${bucket.public}).`);
    return;
  }

  // Com publishable/anon key, storage.buckets pode ficar oculto por RLS, mas listar objetos funciona se o bucket existir.
  const { error: listErr } = await client.storage.from(BUCKET_NAME).list('', { limit: 1 });
  if (!listErr) {
    console.log(`Bucket '${BUCKET_NAME}' acessível e pronto para uso.`);
    return;
  }

  console.log(`Bucket '${BUCKET_NAME}' não encontrado/acessível (${listErr.message}). Tentando criar...`);
  const { error: createErr } = await client.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  });

  if (createErr) {
    throw new Error(
      `Não foi possível acessar/criar o bucket '${BUCKET_NAME}': ${createErr.message}. ` +
      `Verifique se o SQL de supabase_storage_setup.sql foi executado no Supabase.`
    );
  }
  console.log(`Bucket '${BUCKET_NAME}' criado com sucesso.`);
}

async function fetchAllProductIds(client) {
  const ids = [];
  const PAGE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from('products')
      .select('id')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      throw new Error(`Falha ao listar IDs de produtos: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row?.id) ids.push(row.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return ids;
}

async function fetchProductRowsResilient(client, chunkIds) {
  if (chunkIds.length === 0) return [];
  const { data, error } = await client
    .from('products')
    .select('id, name, image, images, updated_at')
    .in('id', chunkIds);

  if (!error && data) return data;

  if (chunkIds.length > 1) {
    const mid = Math.ceil(chunkIds.length / 2);
    const left = await fetchProductRowsResilient(client, chunkIds.slice(0, mid));
    const right = await fetchProductRowsResilient(client, chunkIds.slice(mid));
    return [...left, ...right];
  }

  throw new Error(`Falha ao buscar produto ${chunkIds[0]}: ${error?.message || 'Erro desconhecido'}`);
}

async function uploadImageBuffer(client, productId, index, parsed) {
  const safeId = String(productId).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `products/${safeId}/${Date.now()}-${index}.${parsed.ext}`;

  const { error: uploadErr } = await client.storage
    .from(BUCKET_NAME)
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mimeType,
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadErr) {
    throw new Error(`Upload falhou (${storagePath}): ${uploadErr.message}`);
  }

  const { data: pub } = client.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) {
    throw new Error(`Falha ao gerar URL pública para ${storagePath}`);
  }

  await verifyPublicUrlOk(publicUrl);
  return { storagePath, publicUrl, byteSize: parsed.buffer.length };
}

async function run() {
  const env = loadEnvFiles();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL não definido.');
  }

  const { client } = await createWorkingClient(supabaseUrl, env);
  await ensureBucketReady(client);

  const allIds = await fetchAllProductIds(client);
  console.log(`Total de produtos encontrados no banco: ${allIds.length}`);

  const affectedRows = [];
  let alreadyMigratedOrLocal = 0;

  for (let i = 0; i < allIds.length; i += FETCH_BATCH_SIZE) {
    const batchIds = allIds.slice(i, i + FETCH_BATCH_SIZE);
    const rows = await fetchProductRowsResilient(client, batchIds);

    for (const row of rows) {
      const hasMainB64 = isBase64Image(row.image);
      const hasArrayB64 = Array.isArray(row.images) && row.images.some(isBase64Image);

      if (hasMainB64 || hasArrayB64) {
        affectedRows.push(row);
      } else {
        alreadyMigratedOrLocal++;
      }
    }
    console.log(`Varredura: ${Math.min(i + FETCH_BATCH_SIZE, allIds.length)}/${allIds.length} produtos verificados (${affectedRows.length} com Base64).`);
  }

  if (affectedRows.length === 0) {
    console.log('Nenhum produto com imagem Base64 restante. Tudo já está migrado!');
    return;
  }

  // Backup local antes de qualquer alteração no banco
  if (!fs.existsSync(BACKUP_FILE)) {
    fs.writeFileSync(
      BACKUP_FILE,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          supabaseUrl,
          totalProductsInDb: allIds.length,
          affectedCount: affectedRows.length,
          products: affectedRows
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`Backup salvo com segurança em ${BACKUP_FILE} (${affectedRows.length} registros).`);
  } else {
    console.log(`Arquivo de backup já existe em ${BACKUP_FILE}; preservando backup original.`);
  }

  let migratedProducts = 0;
  let uploadedImagesCount = 0;
  let totalBase64BytesRemoved = 0;
  let totalStorageBytesUploaded = 0;

  for (let idx = 0; idx < affectedRows.length; idx++) {
    const row = affectedRows[idx];
    const uploadedByDataUrl = new Map();
    let imageIdx = 0;

    let nextImage = row.image;
    if (isBase64Image(row.image)) {
      const trimmed = row.image.trim();
      totalBase64BytesRemoved += row.image.length;
      const parsed = parseDataUrl(trimmed);
      if (!parsed) {
        throw new Error(`Base64 inválido no campo image do produto ${row.id}`);
      }
      const uploaded = await uploadImageBuffer(client, row.id, imageIdx++, parsed);
      uploadedByDataUrl.set(trimmed, uploaded.publicUrl);
      uploadedImagesCount++;
      totalStorageBytesUploaded += uploaded.byteSize;
      nextImage = uploaded.publicUrl;
    }

    let nextImages = Array.isArray(row.images) ? [...row.images] : [];
    for (let j = 0; j < nextImages.length; j++) {
      const item = nextImages[j];
      if (!isBase64Image(item)) continue;

      const trimmed = item.trim();
      totalBase64BytesRemoved += item.length;

      if (uploadedByDataUrl.has(trimmed)) {
        nextImages[j] = uploadedByDataUrl.get(trimmed);
      } else {
        const parsed = parseDataUrl(trimmed);
        if (!parsed) {
          throw new Error(`Base64 inválido em images[${j}] do produto ${row.id}`);
        }
        const uploaded = await uploadImageBuffer(client, row.id, imageIdx++, parsed);
        uploadedByDataUrl.set(trimmed, uploaded.publicUrl);
        uploadedImagesCount++;
        totalStorageBytesUploaded += uploaded.byteSize;
        nextImages[j] = uploaded.publicUrl;
      }
    }

    if (nextImages.length === 0 && nextImage) {
      nextImages = [nextImage];
    }

    const { error: updateErr } = await client
      .from('products')
      .update({
        image: nextImage,
        images: nextImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id);

    if (updateErr) {
      throw new Error(`Falha ao atualizar produto ${row.id} no Supabase: ${updateErr.message}`);
    }

    migratedProducts++;
    console.log(
      `[${migratedProducts}/${affectedRows.length}] Produto ${row.id} (${row.name}) migrado -> ${nextImage}`
    );
  }

  console.log('\n=== RESUMO DA MIGRAÇÃO ===');
  console.log(`Total de produtos no banco: ${allIds.length}`);
  console.log(`Já migrados ou com URL local: ${alreadyMigratedOrLocal}`);
  console.log(`Produtos migrados nesta execução: ${migratedProducts}`);
  console.log(`Arquivos enviados ao Storage '${BUCKET_NAME}': ${uploadedImagesCount}`);
  console.log(`Base64 removido do Postgres: ${(totalBase64BytesRemoved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total binário no Storage: ${(totalStorageBytesUploaded / 1024 / 1024).toFixed(2)} MB`);
}

run().catch((err) => {
  console.error('ERRO NA MIGRAÇÃO:', err);
  process.exit(1);
});
