import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("immersion_objectives", [
    "Confirmer un projet professionnel",
    "Découvrir un métier ou un secteur d'activité",
    "Initier une démarche de recrutement",
  ]);
  pgm.addColumns("discussions", {
    potential_beneficiary_phone: {
      type: "text",
      notNull: false,
      default: null,
    },
    immersion_objective: {
      type: "immersion_objectives",
      notNull: false,
      default: null,
    },
    potential_beneficiary_resume_link: {
      type: "text",
      notNull: false,
      default: null,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("discussions", [
    "potential_beneficiary_phone",
    "immersion_objective",
    "potential_beneficiary_resume_link",
  ]);
  pgm.dropType("immersion_objectives");
}
