import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("conventions", {
    individual_protection_description: {
      type: "varchar(255)",
      notNull: true,
      default: "",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("conventions", "individual_protection_description");
}
