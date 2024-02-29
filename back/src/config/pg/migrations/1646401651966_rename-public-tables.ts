import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("appellations_public_data", "public_appelations_data");
  pgm.renameTable("romes_public_data", "public_romes_data");
  pgm.renameTable("naf_classes_2008", "public_naf_classes_2008");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("public_appelations_data", "appellations_public_data");
  pgm.renameTable("public_romes_data", "romes_public_data");
  pgm.renameTable("public_naf_classes_2008", "naf_classes_2008");
}
