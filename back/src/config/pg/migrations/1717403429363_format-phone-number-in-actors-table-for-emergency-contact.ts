import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { MigrationBuilder } from "node-pg-migrate";
import { z } from "zod";

const supportedCountryCode: CountryCode[] = ["FR", "NC", "PF", "WF", "PM"];

const phoneSchema = z
  .string()
  .min(1)
  .transform((phone, ctx) => {
    const countryCode = supportedCountryCode.find((countryCode) =>
      isValidPhoneNumber(phone, countryCode),
    );

    if (!countryCode) {
      ctx.addIssue({
        message: `Le numéro de téléphone '${phone}' n'est pas valide.`,
        code: "custom",
      });
      return z.NEVER;
    }
    return parsePhoneNumber(phone, countryCode).format("E.164");
  });

const batchSize = 10000;
const actorsTableName = "actors";

export async function up(pgm: MigrationBuilder): Promise<void> {
  console.time("actors");
  await updateFormEstablishments(pgm);
  console.timeEnd("actors");
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}

async function updateFormEstablishments(pgm: MigrationBuilder): Promise<void> {
  const jsonColumnName = "extra_fields";
  const primaryKey = "id";
  let offset = 0;

  while (true) {
    console.time("query duration");
    const query = `
      SELECT ${jsonColumnName} ->> 'emergencyContactPhone' AS phone, ${primaryKey}
      FROM ${actorsTableName}
      WHERE ${jsonColumnName} ->> 'emergencyContactPhone' != ''
      ORDER BY ${primaryKey}
      LIMIT ${batchSize} OFFSET ${offset}
    `;
    const { rows } = await pgm.db.query(query);
    console.timeEnd("query duration");

    if (rows.length === 0) {
      break;
    }

    console.time("typescript process");
    const updates = rows.reduce(
      (acc, row) => {
        const result = phoneSchema.safeParse(row.phone);
        const newPhone = JSON.stringify(result.success ? result.data : "");
        return {
          ids: [...acc.ids, row[primaryKey]],
          phones: [...acc.phones, newPhone],
        };
      },
      { ids: [], phones: [] },
    );
    console.timeEnd("typescript process");

    console.time("update query");
    const updateQuery = `
      UPDATE ${actorsTableName} SET
      ${jsonColumnName} = jsonb_set(${jsonColumnName}, '{emergencyContactPhone}', unnested.phone::jsonb)
      FROM (
        SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS phone
      ) AS unnested
      WHERE ${actorsTableName}.${primaryKey} = unnested.id
    `;
    await pgm.db.query(updateQuery, [updates.ids, updates.phones]);
    console.timeEnd("update query");

    offset += batchSize;
  }
}
