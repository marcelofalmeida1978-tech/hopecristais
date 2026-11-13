-- =========================================================================
-- HOPE CRISTAIS - CONFIGURAÇÃO DO SUPABASE STORAGE (BUCKET product-images)
-- Execute este script no SQL Editor do projeto Supabase oficial (tzicihnadrkynzupsdqp)
-- =========================================================================

-- 1. Criar (ou atualizar) o bucket público 'product-images'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB por imagem
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Remover políticas antigas caso existam (idempotência)
drop policy if exists "Imagens de produtos visíveis publicamente" on storage.objects;
drop policy if exists "Upload de imagens de produtos" on storage.objects;
drop policy if exists "Atualização de imagens de produtos" on storage.objects;
drop policy if exists "Exclusão de imagens de produtos" on storage.objects;

-- 3. Políticas de acesso compatíveis com o modelo atual do catálogo e /admin
-- Leitura pública para vitrine e visitantes
create policy "Imagens de produtos visíveis publicamente"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

-- Upload, atualização (upsert requer SELECT + INSERT + UPDATE) e exclusão pelo painel /admin
create policy "Upload de imagens de produtos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'product-images');

create policy "Atualização de imagens de produtos"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "Exclusão de imagens de produtos"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'product-images');
