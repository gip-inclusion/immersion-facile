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
    [establishmentColumns.phone]: { type: "text" },
    [establishmentColumns.job]: { type: "text" },
    [establishmentColumns.copyEmails]: { type: "JSONB" },
    [addressColumns.streetNumberAndAddress]: { type: "text" },
    [addressColumns.postcode]: { type: "text" },
    [addressColumns.departmentCode]: { type: "text" },
    [addressColumns.city]: { type: "text" },
  });

  // TODO migrate data
  // TODO add not null constraint

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
