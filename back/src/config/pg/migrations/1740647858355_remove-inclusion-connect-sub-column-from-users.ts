import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("users", "inclusion_connect_sub");
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
