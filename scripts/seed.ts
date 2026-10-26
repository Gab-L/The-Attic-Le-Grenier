import { catalogue, collections } from "../src/lib/catalog";
import { pool, transaction } from "../src/lib/db";
try {
  await transaction(async (c) => {
    for (const item of collections)
      await c.query(
        "INSERT INTO collections(id,name,description,reward) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [item.id, item.name, item.description, item.reward],
      );
    for (const d of catalogue)
      await c.query(
        "INSERT INTO definitions(id,slug,name,description,period,category,collection_id,rarity,illustration,width,surfaces,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING",
        [
          d.id,
          d.slug,
          d.name,
          d.description,
          d.period,
          d.category,
          d.collection_id,
          d.rarity,
          d.illustration,
          d.width,
          JSON.stringify(d.surfaces),
          d.active,
        ],
      );
  });
  console.log(
    "Catalogue prêt : 36 objets, 6 collections. Aucun joueur de démonstration ajouté.",
  );
} finally {
  await pool.end();
}
