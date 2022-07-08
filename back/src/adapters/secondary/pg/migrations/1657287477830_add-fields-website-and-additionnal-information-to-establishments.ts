import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("establishments", {
    website: { type: "varchar(255)", notNull: false, default: "" },
    additional_information: {
      type: "varchar(255)",
      notNull: false,
      default: "",
    },
  });
  pgm.addColumns("form_establishments", {
    website: { type: "varchar(255)", notNull: false, default: "" },
    additional_information: {
      type: "varchar(255)",
      notNull: false,
      default: "",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("establishments", ["website", "additional_information"]);
  pgm.dropColumns("form_establishments", ["website", "additional_information"]);
}
