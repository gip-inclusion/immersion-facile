import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("public_appellations_data", {
    legacy_code_rome_v3: {
      type: "char(5)",
      references: "public_romes_data(code_rome)",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("public_appellations_data", "legacy_code_rome_v3");
}
