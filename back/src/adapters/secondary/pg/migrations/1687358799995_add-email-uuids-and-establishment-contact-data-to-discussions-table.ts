import { MigrationBuilder } from "node-pg-migrate";

const discussionsTable = "discussions";
const potentialBeneficiaryEmailUuidColumn = "potential_beneficiary_email_uuid";
const establishmentColumns = {
  emailUuid: "establishment_contact_email_uuid",
  email: "establishment_contact_email",
  firstName: "establishment_contact_first_name",
  lastName: "establishment_contact_last_name",
  phone: "establishment_contact_phone",
  job: "establishment_contact_job",
  copyEmails: "establishment_contact_copy_emails",
};
const addressColumns = {
  streetNumberAndAddress: "street_number_and_address",
  postcode: "postcode",
  departmentCode: "department_code",
  city: "city",
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(discussionsTable, {
    [potentialBeneficiaryEmailUuidColumn]: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    [establishmentColumns.emailUuid]: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    [establishmentColumns.email]: { type: "text" },
    [establishmentColumns.firstName]: { type: "text" },
    [establishmentColumns.lastName]: { type: "text" },
    [establishmentColumns.phone]: { type: "text", notNull: false }, // this is the only column that is nullable
    [establishmentColumns.job]: { type: "text" },
    [establishmentColumns.copyEmails]: {
      type: "jsonb",
      default: "[]",
      notNull: true,
    },
    [addressColumns.streetNumberAndAddress]: { type: "text" },
    [addressColumns.postcode]: { type: "text" },
    [addressColumns.departmentCode]: { type: "text" },
    [addressColumns.city]: { type: "text" },
  });

  // migrate data
  pgm.sql(`
    WITH data_to_update AS (
      SELECT e.siret, c.email, c.firstname, c.lastname, c.phone, c.job, c.copy_emails, e.street_number_and_address, e.post_code, e.department_code, e.city
      FROM establishments e
      LEFT JOIN establishments__immersion_contacts eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts c ON c.uuid = eic.contact_uuid
    ) UPDATE ${discussionsTable} d
        SET
            ${establishmentColumns.email} = data_to_update.email,
            ${establishmentColumns.firstName} = data_to_update.firstname,
            ${establishmentColumns.lastName} = data_to_update.lastname,
            ${establishmentColumns.phone} = data_to_update.phone,
            ${establishmentColumns.job} = data_to_update.job,
            ${establishmentColumns.copyEmails} = data_to_update.copy_emails,
            ${addressColumns.streetNumberAndAddress} = data_to_update.street_number_and_address,
            ${addressColumns.postcode} = data_to_update.post_code,
            ${addressColumns.departmentCode} = data_to_update.department_code,
            ${addressColumns.city} = data_to_update.city
        FROM data_to_update
        WHERE d.siret = data_to_update.siret
    `);

  // TODO add not null constraint
  pgm.alterColumn(discussionsTable, establishmentColumns.email, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, establishmentColumns.firstName, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, establishmentColumns.lastName, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, establishmentColumns.phone, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, establishmentColumns.job, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, addressColumns.streetNumberAndAddress, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, addressColumns.postcode, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, addressColumns.departmentCode, {
    notNull: true,
  });
  pgm.alterColumn(discussionsTable, addressColumns.city, {
    notNull: true,
  });

  // we want to force new entries to provide a valid uuid
  pgm.alterColumn(discussionsTable, potentialBeneficiaryEmailUuidColumn, {
    default: null,
  });
  pgm.alterColumn(discussionsTable, establishmentColumns.emailUuid, {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(discussionsTable, [
    potentialBeneficiaryEmailUuidColumn,
    establishmentColumns.emailUuid,
    establishmentColumns.email,
    establishmentColumns.firstName,
    establishmentColumns.lastName,
    establishmentColumns.phone,
    establishmentColumns.job,
    establishmentColumns.copyEmails,
    addressColumns.streetNumberAndAddress,
    addressColumns.postcode,
    addressColumns.departmentCode,
    addressColumns.city,
  ]);
}
