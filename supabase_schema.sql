-- =========================================================================
-- HOPE CRISTAIS - BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (painel web)
-- =========================================================================

-- 1. TABELA DE CATEGORIAS
create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  subtitle text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE PRODUTOS
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric not null default 0,
  price_formatted text not null default 'R$ 00,00',
  image text not null,
  images text[] default array[]::text[],
  description text default '',
  short_description text default '',
  dimensions text,
  weight text,
  in_stock boolean not null default true,
  quantity integer not null default 1,
  is_featured boolean not null default false,
  tag text,
  details text[] default array[]::text[],
  care_instructions text,
  keywords text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DICA: Se a tabela já existir no seu Supabase, adicione o campo de quantidade executando:
-- alter table public.products add column if not exists quantity integer not null default 1;

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- 4. POLÍTICAS DE ACESSO PARA CATEGORIAS
-- Leitura pública para todos os visitantes do site
create policy "Categorias visíveis para todos"
  on public.categories for select
  using (true);

-- Permissão total para inserção, atualização e exclusão
create policy "Gerenciar categorias"
  on public.categories for all
  using (true)
  with check (true);

-- 5. POLÍTICAS DE ACESSO PARA PRODUTOS
-- Leitura pública para todos os visitantes do site
create policy "Produtos visíveis para todos"
  on public.products for select
  using (true);

-- Permissão total para inserção, atualização e exclusão
create policy "Gerenciar produtos"
  on public.products for all
  using (true)
  with check (true);

-- 6. POPULAR CATEGORIAS INICIAIS
insert into public.categories (id, name)
values
  ('cristais', 'Cristais'),
  ('pulseiras', 'Pulseiras'),
  ('decoracao', 'Decoração'),
  ('kits-presentes', 'Kits & Presentes'),
  ('pedras-brutas', 'Pedras Brutas'),
  ('drusas', 'Drusas'),
  ('pontas', 'Pontas'),
  ('na-base', 'Na Base'),
  ('diversos', 'Diversos')
on conflict (id) do nothing;

-- 7. POPULAR CATÁLOGO OFICIAL COM PREÇOS ATUALIZADOS
insert into public.products (
  id,
  name,
  category,
  price,
  price_formatted,
  image,
  short_description,
  description,
  details,
  care_instructions,
  dimensions,
  keywords,
  is_featured,
  tag,
  in_stock,
  quantity
)
values
  (
    'drusa-ametista',
    'Drusa de Ametista',
    'Cristais',
    50,
    'R$ 50,00',
    '/assets/produto_ametista.jpg',
    'Formação natural com suporte elegante, transmitindo serenidade, equilíbrio e beleza estética.',
    'Uma imponente formação natural com tonalidades violetas profundas, repousando sobre uma base de suporte em metal negro. Cada ponta cristalina reflete a luz com encanto único, trazendo sofisticação e harmonia estética para salas de estar, escritórios ou espaços de meditação.',
    array['Peça 100% natural e autêntica', 'Acompanha base suporte personalizada', 'Tonalidades violeta e lilás profundos', 'Curadoria manual exclusiva Hope'],
    'Limpar com pano seco e macio. Evitar exposição prolongada à luz solar direta para preservar a intensidade natural de suas cores.',
    'Peça selecionada individualmente',
    array['ametista', 'drusa', 'cristal', 'violeta', 'suporte', 'decoração', 'harmonia'],
    true,
    'Destaque',
    true,
    3
  ),
  (
    'drusa-branca',
    'Drusa Branca',
    'Cristais',
    100,
    'R$ 100,00',
    '/assets/produto_drusa_branca.jpg',
    'Cristal com textura pura e translúcida sobre base escura, simbolizando clareza e paz.',
    'Com uma estética minimalista e pura, esta formação cristalina branca evoca frescor, leveza e conexão sutil com a natureza. Seu relevo orgânico e a delicadeza dos pequenos cristais criam um ponto focal de elegância atemporal em qualquer ambiente.',
    array['Cristal natural de formação cristalina única', 'Montagem especial em pedestal escuro', 'Estrutura com brilho translúcido refinado', 'Ideal para composições contemporâneas'],
    'Higienizar suavemente com pincel de cerdas macias ou pano seco.',
    'Formato orgânico natural',
    array['drusa', 'branca', 'quartzo', 'pureza', 'clareza', 'minimalismo', 'cristal'],
    true,
    'Exclusivo',
    true,
    2
  ),
  (
    'jardim-zen-cristais',
    'Jardim Zen com Cristais',
    'Decoração',
    150,
    'R$ 150,00',
    '/assets/produto_jardim_zen.jpg',
    'Composição decorativa com areia fina, miniatura de bonsai, portal e pedras naturais verdes.',
    'Um convite diário à pausa e contemplação. Este conjunto zen equilibra a suavidade da areia fina trabalhada com o ancinho, a serenidade da árvore e do portal, e o frescor das pedras verdes roladas de acabamento acetinado. Perfeito para mesas de trabalho e cantos de leitura.',
    array['Bandeja zen com areia refinada e ancinho', 'Pedras naturais selecionadas de tonalidade verde suave', 'Escultura bonsai e portal de contemplação', 'Peça de design para momentos de pausa e bem-estar'],
    'Mantenha em local seco e arejado. A areia pode ser reorganizada suavemente com os pequenos ancinhos inclusos.',
    'Conjunto completo de mesa',
    array['jardim zen', 'decoração', 'bonsai', 'pedras verdes', 'calmaria', 'zen', 'mesa'],
    true,
    'Bem-estar',
    true,
    4
  ),
  (
    'pulseira-olho-de-tigre',
    'Pulseira Olho de Tigre',
    'Pulseiras',
    200,
    'R$ 200,00',
    '/assets/produto_pulseira_olho_tigre.jpg',
    'Esferas naturais com brilho sedoso em tons dourados e terrosos, evocando coragem e elegância.',
    'Criada com esferas naturais perfeitamente polidas de Olho de Tigre, esta pulseira destaca-se pelos reflexos dourados e castanhos característicos da gema. Uma joia afetiva e versátil que complementa produções sofisticadas com charme e presença discreta.',
    array['Pedras naturais de Olho de Tigre legítimo', 'Efeito óptico de reflexo sedoso e dourado', 'Fio elástico de alta resistência e ajuste confortável', 'Acabamento polido artesanal'],
    'Evitar contato com produtos químicos, perfumes e água do mar para manter o brilho sedoso das pedras.',
    'Circunferência padrão flexível',
    array['pulseira', 'olho de tigre', 'dourado', 'pedra natural', 'joia', 'acessório'],
    true,
    null,
    true,
    5
  ),
  (
    'pulseira-de-onix',
    'Pulseira de Ônix',
    'Pulseiras',
    0,
    'R$ 00,00',
    '/assets/produto_pulseira_onix.jpg',
    'Contas pretas foscas e polidas que combinam sobriedade, sofisticação e firmeza atemporal.',
    'A elegância incontestável do Ônix em uma peça minimalista e expressiva. Suas contas escuras e homogêneas dialogam com qualquer estilo, carregando a simbologia clássica de segurança, foco e determinação.',
    array['Pedras naturais de Ônix autêntico', 'Design sóbrio e contemporâneo', 'Excelente caimento unissex', 'Montagem com fio de silicone reforçado'],
    'Para higienizar, utilize apenas uma flanela seca ou ligeiramente umedecida com água.',
    'Circunferência padrão ajustável',
    array['pulseira', 'ônix', 'preto', 'acessório', 'pedra natural', 'elegância'],
    true,
    null,
    true,
    5
  ),
  (
    'kit-agata-aromas',
    'Kit Ágata & Aromas',
    'Decoração',
    0,
    'R$ 00,00',
    '/assets/produto_kit_agata_aromas.jpg',
    'Composição decorativa com fatias de ágata translúcida em tons âmbar e frasco difusor.',
    'A união entre a beleza geológica das camadas da Ágata natural e o aconchego aromático. O kit conta com lâminas translúcidas de ágata polida que evidenciam seus anéis de crescimento milenares em tons de mel e âmbar, acompanhadas de difusor em vidro nobre com detalhes dourados.',
    array['Chapas de ágata natural com bordas rústicas e centro translúcido', 'Frasco de vidro com tampa dourada e varetas difusoras', 'Peça escultural inspirada em formas orgânicas de borboleta', 'Sensação acolhedora para lavabos, quartos e salas'],
    'Limpar as peças de ágata com pano macio. O frasco difusor pode ser higienizado com água e sabão neutro ao renovar a fragrância.',
    'Composição decorativa completa',
    array['ágata', 'aromas', 'difusor', 'decoração', 'âmbar', 'kit', 'casa', 'perfume'],
    true,
    'Favorito',
    true,
    2
  )
on conflict (id) do update set
  price = excluded.price,
  price_formatted = excluded.price_formatted,
  category = excluded.category,
  quantity = excluded.quantity,
  updated_at = timezone('utc'::text, now());

-- =========================================================================
-- 8. TABELA DE PEDIDOS & PAGAMENTOS (MERCADO PAGO)
-- =========================================================================
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  customer_whatsapp text not null,
  customer_email text not null,
  customer_cpf text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  payment_method text not null default 'credit_card',
  payment_id text,
  payment_status text not null default 'pending',
  payment_status_detail text,
  card_last_four text,
  installments integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Pedidos visíveis para todos"
  on public.orders for select
  using (true);

create policy "Gerenciar pedidos"
  on public.orders for all
  using (true)
  with check (true);

