import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tzicihnadrkynzupsdqp.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Fetching all products from Supabase...');
  const pageSize = 25;
  let allRows = [];

  for (let from = 0; from < 500; from += pageSize) {
    const to = from + pageSize - 1;
    let data = null;
    try {
      const res = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (res.error) throw res.error;
      data = res.data;
    } catch (err) {
      console.log('Splitting range due to size:', from, to);
      const mid = from + Math.floor((to - from) / 2);
      const [res1, res2] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }).range(from, mid),
        supabase.from('products').select('*').order('created_at', { ascending: false }).range(mid + 1, to)
      ]);
      data = [...(res1.data || []), ...(res2.data || [])];
    }
    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < pageSize) break;
    } else {
      break;
    }
  }

  console.log(`Fetched ${allRows.length} rows.`);

  const backupPath = path.join(projectRoot, 'products_supabase_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(allRows, null, 2));
  console.log(`Backup written to ${backupPath}`);

  const publicProductsDir = path.join(projectRoot, 'public', 'products');
  if (!fs.existsSync(publicProductsDir)) fs.mkdirSync(publicProductsDir, { recursive: true });

  let savedImages = 0;
  let preservedImages = 0;

  for (const row of allRows) {
    const img = row.image;
    if (img && img.startsWith('data:image/')) {
      const matches = img.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        let ext = matches[1].toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${row.id}.${ext}`;
        const filePath = path.join(publicProductsDir, filename);
        fs.writeFileSync(filePath, buffer);
        savedImages++;
      } else {
        console.warn('Could not parse base64 for', row.id);
      }
    } else if (img) {
      preservedImages++;
    }
  }

  console.log(`Saved ${savedImages} image files to ${publicProductsDir}. Preserved existing URLs: ${preservedImages}`);
}

run().catch(console.error);
