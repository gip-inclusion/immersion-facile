/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("establishments", "is_active");
  pgm.createIndex("establishments__immersion_contacts", "establishment_siret");
  pgm.createIndex("establishments__immersion_contacts", "contact_uuid");
  pgm.createIndex("immersion_offers", "rome_appellation");
  pgm.createIndex("immersion_offers", "rome_code");
  pgm.createIndex("immersion_offers", "siret");
  pgm.createIndex("public_naf_classes_2008", "class_id");
  pgm.createIndex("outbox_publications", "event_id");
  pgm.createIndex("outbox_failures", "publication_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("outbox_failures", "publication_id");
  pgm.dropIndex("outbox_publications", "event_id");
  pgm.dropIndex("public_naf_classes_2008", "class_id");
  pgm.dropIndex("immersion_offers", "siret");
  pgm.dropIndex("immersion_offers", "rome_code");
  pgm.dropIndex("immersion_offers", "rome_appellation");
  pgm.dropIndex("establishments__immersion_contacts", "establishment_siret");
  pgm.dropIndex("establishments__immersion_contacts", "contact_uuid");
  pgm.dropIndex("establishments", "is_active");
}
