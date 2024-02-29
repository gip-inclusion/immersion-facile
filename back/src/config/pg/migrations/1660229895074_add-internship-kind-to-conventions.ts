/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("internship_kind", ["immersion", "mini-stage-cci"]);
  pgm.addColumn("conventions", {
    internship_kind: {
      type: "internship_kind",
      default: "immersion",
      notNull: true,
    },
  });
  pgm.alterColumn("conventions", "internship_kind", { default: null });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("conventions", "internship_kind");
  pgm.dropType("internship_kind");
}
