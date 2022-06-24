/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";
import format from "pg-format";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const ids_of_old_conventions = (
    await pgm.db.query(`
              select id from immersion_applications ia
              left join convention_external_ids cei on cei.convention_id = ia.id
              where external_id is null`)
  ).rows.map((row) => [row.id]);
  await pgm.sql(
    format(
      `INSERT INTO convention_external_ids (convention_id) VALUES %L`,
      ids_of_old_conventions,
    ),
  );
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
