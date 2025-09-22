import { db } from "./src/index.js";

async function inspectBadgeCriteria() {
  try {
    console.log("Inspecting Badge table criteria column...");

    const badges = await db.execute(`
      SELECT id, name, criteria::text as criteria_text
      FROM "Badge"
      WHERE criteria IS NOT NULL
      LIMIT 10
    `);

    console.log("Found badges with criteria:");
    console.log(badges.rows);

    // Check the data types
    const columnInfo = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Badge' AND column_name = 'criteria'
    `);

    console.log("Column info:");
    console.log(columnInfo.rows);

  } catch (error) {
    console.error("Error inspecting badge criteria:", error);
  } finally {
    process.exit(0);
  }
}

inspectBadgeCriteria();
