import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_offers", "score");
  pgm.addColumn("establishments", {
    score: {
      type: "int",
      notNull: true,
      default: 0,
    },
  });

  await pgm.db.query(`
    UPDATE establishments 
    SET update_date = created_at
    WHERE update_date IS NULL;
  `);
  pgm.alterColumn("establishments", "update_date", {
    notNull: true,
    default: null,
  });
  pgm.addIndex("establishments", ["score"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("establishments", "score");
  pgm.addColumn("immersion_offers", {
    score: {
      type: "int",
      notNull: true,
      default: 10,
    },
  });
  pgm.alterColumn("establishments", "update_date", { notNull: false });
}
