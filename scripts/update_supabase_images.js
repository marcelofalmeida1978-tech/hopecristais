import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tzicihnadrkynzupsdqp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_c2nMLwJMNOrM8PKeHwp-rA_2lr2cEzt';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Checking products in Supabase needing image URL update...');

  const batchSize = 25;
  let allRows = [];
  for (let from = 0; from < 500; from += batchSize) {
    const to = from + batchSize - 1;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image, images')
      .range(from, to);
    if (error) {
      console.error('Error fetching range:', from, to, error);
      break;
    }
    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < batchSize) break;
    } else {
      break;
    }
  }

  console.log(`Found ${allRows.length} products total.`);

  let updatedCount = 0;
  for (const p of allRows) {
    if (p.image && p.image.startsWith('data:image/')) {
      const newUrl = `/products/${p.id}.jpg`;
      const { error } = await supabase
        .from('products')
        .update({
          image: newUrl,
          images: [newUrl],
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);

      if (error) {
        console.error(`Failed to update ${p.id}:`, error);
      } else {
        updatedCount++;
        if (updatedCount % 20 === 0 || updatedCount === allRows.length) {
          console.log(`Updated ${updatedCount} products...`);
        }
      }
    }
  }

  console.log(`Finished! Successfully updated ${updatedCount} products in Supabase.`);
}

run().catch(console.error);
