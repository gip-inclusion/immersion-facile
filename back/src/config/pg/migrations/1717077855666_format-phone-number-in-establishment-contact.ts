/* eslint-disable @typescript-eslint/naming-convention */
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

const defaultPhoneNumber = "+33500000000";
const batchSize = 10000;
const establishmentContactTableName = "establishments_contacts";
const discussionsTableName = "discussions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  console.time("establishmentContactTable");
  await updateEstablishmentContactTable(pgm);
  console.timeEnd("establishmentContactTable");

  console.time("Discussions");
  await updateDiscussions(pgm);
  console.timeEnd("Discussions");
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}

async function updateEstablishmentContactTable(
  pgm: MigrationBuilder,
): Promise<void> {
  let offset = 0;

  while (true) {
    const queryDuration = `query establishments_contacts duration offset = ${offset}`;
    const typescriptDuration = `typescript establishments_contacts process offset = ${offset}`;
    const updateQueryTime = `update establishments_contacts query offset = ${offset}`;
    console.time(queryDuration);

    const query = `SELECT phone, uuid 
    FROM ${establishmentContactTableName}
    ORDER BY uuid
    LIMIT ${batchSize} 
    OFFSET ${offset} 
    `;

    const { rows } = await pgm.db.query(query);
    console.timeEnd(queryDuration);
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("row.length ====>", rows.length);
    if (rows.length === 0) {
      break;
    }
    console.time(typescriptDuration);

    const updates = rows.reduce(
      (acc, row) => {
        const result = phoneSchema.safeParse(row.phone);
        const updatedPhone = result.success ? result.data : defaultPhoneNumber;
        return {
          ids: [...acc.ids, row.uuid],
          phones: [...acc.phones, updatedPhone],
        };
      },
      { ids: [], phones: [] },
    );

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("updates.ids.length ====>", updates.ids.length);
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("updates.phones.length ====>", updates.phones.length);

    console.timeEnd(typescriptDuration);

    const updateQuery = `UPDATE establishments_contacts
    SET phone = unnested.phone
    FROM (
      SELECT unnest($1::uuid[]) as id, 
             unnest($2::varchar(255)[]) as phone
      ) as unnested
    WHERE establishments_contacts.uuid = unnested.id`;

    console.time(updateQueryTime);
    await pgm.db.query(updateQuery, [updates.ids, updates.phones]);
    console.timeEnd(updateQueryTime);
    offset += batchSize;
  }
}

async function updateDiscussions(pgm: MigrationBuilder): Promise<void> {
  console.time("query duration");
  const query = `
      SELECT id, establishment_contact_phone, potential_beneficiary_phone
      FROM ${discussionsTableName}
      WHERE created_at > '2024-05-30 10:29:00.779+00'
      ORDER BY id
    `;
  const { rows } = await pgm.db.query(query);

  console.timeEnd("query duration");

  console.time("typescript process");

  const updates = rows.reduce(
    (acc, row) => {
      const estContactPhoneResult = phoneSchema.safeParse(
        row.establishment_contact_phone,
      );
      const potBenefPhoneResult = phoneSchema.safeParse(
        row.potential_beneficiary_phone,
      );

      const estContactPhone = estContactPhoneResult.success
        ? estContactPhoneResult.data
        : defaultPhoneNumber;

      const potBenefPhone = potBenefPhoneResult.success
        ? potBenefPhoneResult.data
        : null;

      return {
        ids: [...acc.ids, row.id],
        estContactPhones: [...acc.estContactPhones, estContactPhone],
        potBenefPhones: [...acc.potBenefPhones, potBenefPhone],
      };
    },
    { ids: [], estContactPhones: [], potBenefPhones: [] },
  );

  console.timeEnd("typescript process");
  console.time("update query");
  const updateQuery = `
      UPDATE ${discussionsTableName} SET
      establishment_contact_phone = unnested.estContactPhone,
      potential_beneficiary_phone = unnested.potBenefPhone
      FROM (
        SELECT unnest($1::uuid[]) AS id, unnest($2::text[]) AS estContactPhone, unnest($3::text[]) AS potBenefPhone
      ) AS unnested
      WHERE ${discussionsTableName}.id = unnested.id;
    `;

  await pgm.db.query(updateQuery, [
    updates.ids,
    updates.estContactPhones,
    updates.potBenefPhones,
  ]);
  console.timeEnd("update query");
}
