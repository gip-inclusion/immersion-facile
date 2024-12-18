/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_assessments", {
    last_day_of_presence: { type: "timestamp with time zone" },
    number_of_missed_hours: { type: "integer" },
    ended_wit_a_job: { type: "boolean", notNull: true, default: false },
    type_of_contract: { type: "varchar(50)" },
    contract_start_date: {
      type: "timestamp with time zone",
    },
    establishment_advices: { type: "text", notNull: true, default: "" },
  });

  pgm.alterColumn("immersion_assessments", "establishment_advices", {
    default: null,
  });
  pgm.alterColumn("immersion_assessments", "ended_wit_a_job", {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_assessments", [
    "last_day_of_presence",
    "number_of_missed_hours",
    "ended_wit_a_job",
    "type_of_contract",
    "contract_start_date",
    "establishment_advices",
  ]);
}
