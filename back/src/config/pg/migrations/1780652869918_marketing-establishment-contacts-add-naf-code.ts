/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("marketing_establishment_contacts", {
    naf_code: { type: "char(5)", notNull: false },
  });
  pgm.addConstraint("public_naf_rev2_sous_classes", "uniq_naf_code", {
    unique: ["naf_code"],
  });
  pgm.addConstraint("marketing_establishment_contacts", "fk_naf_code", {
    foreignKeys: {
      columns: "naf_code",
      references: "public_naf_rev2_sous_classes(naf_code)",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("marketing_establishment_contacts", "fk_naf_code");
  pgm.dropConstraint("public_naf_rev2_sous_classes", "uniq_naf_code");
  pgm.dropColumns("marketing_establishment_contacts", ["naf_code"]);
}
