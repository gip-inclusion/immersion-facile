import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("users", "inclusion_connect_sub");
  await pgm.db.query(
    `DELETE FROM feature_flags WHERE flag_name = 'enableProConnect'`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("users", {
    inclusion_connect_sub: {
      type: "text",
      notNull: false,
      unique: true,
    },
  });
}
