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
const actorsTableName = "actors";
const apiConsumerTableName = "api_consumers";
const formEstablishmentTableName = "form_establishments";
const establishmentContactTableName = "establishments_contacts";
const notificationsSmsTableName = "notifications_sms";
const discussionsTableName = "discussions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  console.time("actorsTable");
  await updateTable(pgm, actorsTableName, "phone", "id");
  console.timeEnd("actorsTable");

  console.time("apiConsumerTable");
  await updateTable(pgm, apiConsumerTableName, "contact_phone", "id");
  console.timeEnd("apiConsumerTable");

  console.time("establishmentContactTable");
  await updateTable(pgm, establishmentContactTableName, "phone", "uuid");
  console.timeEnd("establishmentContactTable");

  console.time("FormEstablishments");
  await updateFormEstablishments(pgm);
  console.timeEnd("FormEstablishments");

  console.time("Discussions");
  await updateDiscussions(pgm);
  console.timeEnd("Discussions");

  console.time("NotificationsSMS");
  await updateNotificationsSMS(pgm);
  console.timeEnd("NotificationsSMS");
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}

async function updateTable(
  pgm: MigrationBuilder,
  tableName: string,
  columnName: string,
  primaryKey: string,
): Promise<void> {
  let offset = 0;

  while (true) {
    console.time("query duration");
    const query = `SELECT ${columnName} AS phone, ${primaryKey} FROM ${tableName} ORDER BY ${primaryKey} LIMIT ${batchSize} OFFSET ${offset}`;
    const { rows } = await pgm.db.query(query);

    console.timeEnd("query duration");

    if (rows.length === 0) {
      break;
    }
    console.time("typescript process");

    const updates = rows.reduce(
      (acc, row) => {
        const result = phoneSchema.safeParse(row.phone);
        const updatedPhone = result.success ? result.data : defaultPhoneNumber;
        return {
          ids: [...acc.ids, row.id],
          phones: [...acc.phones, updatedPhone],
        };
      },
      { ids: [], phones: [] },
    );

    const updateQuery = `UPDATE ${tableName}
    SET ${columnName} = unnested.phone
    FROM (SELECT unnest($1::${tableName === "actors" ? "int[]" : "uuid[]"}) as id, unnest($2::text[]) as phone) as unnested
    WHERE ${tableName}.${primaryKey} = unnested.id;`;

    console.timeEnd("typescript process");
    console.time("update query");
    await pgm.db.query(updateQuery, [updates.ids, updates.phones]);
    console.timeEnd("update query");
    offset += batchSize;
  }
}

async function updateDiscussions(pgm: MigrationBuilder): Promise<void> {
  let offset = 0;

  while (true) {
    console.time("query duration");
    const query = `
      SELECT id, establishment_contact_phone, potential_beneficiary_phone
      FROM ${discussionsTableName}
      ORDER BY id
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
    offset += batchSize;
  }
}

async function updateNotificationsSMS(pgm: MigrationBuilder): Promise<void> {
  let offset = 0;

  while (true) {
    console.time("query duration");
    const query = `
      SELECT id, recipient_phone
      FROM ${notificationsSmsTableName}
      ORDER BY id
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
        const phoneToValidate = row.recipient_phone.startsWith("+")
          ? row.recipient_phone
          : `+${row.recipient_phone}`;
        const result = phoneSchema.safeParse(phoneToValidate);
        const phone = result.success ? result.data : defaultPhoneNumber;
        return {
          ids: [...acc.ids, row.id],
          phones: [...acc.phones, phone],
        };
      },
      { ids: [], phones: [] },
    );
    console.timeEnd("typescript process");

    console.time("update query");
    const updateQuery = `
      UPDATE ${notificationsSmsTableName} SET
      recipient_phone = unnested.phone
      FROM (
        SELECT unnest($1::uuid[]) AS id, unnest($2::text[]) AS phone
      ) AS unnested
      WHERE ${notificationsSmsTableName}.id = unnested.id;
    `;

    await pgm.db.query(updateQuery, [updates.ids, updates.phones]);
    console.timeEnd("update query");

    offset += batchSize;
  }
}

async function updateFormEstablishments(pgm: MigrationBuilder): Promise<void> {
  const jsonColumnName = "business_contact";
  const primaryKey = "siret";
  let offset = 0;

  while (true) {
    console.time("query duration");
    const query = `
      SELECT ${jsonColumnName} ->> 'phone' AS phone, ${primaryKey}
      FROM ${formEstablishmentTableName}
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
        const newPhone = JSON.stringify(
          result.success ? result.data : defaultPhoneNumber,
        );
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
      UPDATE ${formEstablishmentTableName} SET
      ${jsonColumnName} = jsonb_set(${jsonColumnName}, '{phone}', unnested.phone::jsonb)
      FROM (
        SELECT unnest($1::text[]) AS siret, unnest($2::text[]) AS phone
      ) AS unnested
      WHERE ${formEstablishmentTableName}.${primaryKey} = unnested.siret
    `;
    await pgm.db.query(updateQuery, [updates.ids, updates.phones]);
    console.timeEnd("update query");

    offset += batchSize;
  }
}
