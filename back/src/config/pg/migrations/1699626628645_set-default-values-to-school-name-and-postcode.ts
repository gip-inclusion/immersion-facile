import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    update actors 
        set extra_fields = jsonb_set(
            jsonb_set(extra_fields, '{schoolName}', '"Non renseigné"', true),
            '{schoolPostcode}', 
            '"Non renseigné"', 
            true
            )
    where id in (
        select beneficiary_id from conventions where internship_kind = 'mini-stage-cci'
    )
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
  UPDATE actors
  SET extra_fields = extra_fields - 'schoolName' - 'schoolPostcode'
  WHERE extra_fields ? 'schoolName' 
     OR extra_fields ? 'schoolPostcode';
  `);
}
