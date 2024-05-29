/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("outbox", "topic");
  pgm.addIndex("outbox", `("payload" -> 'agency' ->> 'id')`, {
    name: "outbox_payload_agency_id_index",
  });
  pgm.addIndex("outbox", `("payload" -> 'convention' ->> 'id')`, {
    name: "outbox_payload_convention_id_index",
  });
  pgm.addIndex("outbox", `("payload" -> 'formEstablishment' ->> 'siret')`, {
    name: "outbox_payload_formEstablishment_siret_index",
  });
  pgm.addIndex("outbox", `("payload" ->> 'id')`, {
    name: "outbox_payload_id_index",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("outbox", "topic");
  pgm.dropIndex("outbox", "outbox_payload_agency_id_index");
  pgm.dropIndex("outbox", "outbox_payload_convention_id_index");
  pgm.dropIndex("outbox", "outbox_payload_formEstablishment_siret_index");
  pgm.dropIndex("outbox", "outbox_payload_id_index");
}
