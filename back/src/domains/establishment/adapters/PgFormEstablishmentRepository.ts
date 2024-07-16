import { sql } from "kysely";
import {
  DateString,
  FormEstablishmentDto,
  SiretDto,
  castError,
  errors,
  formEstablishmentSchema,
} from "shared";
import { ConflictError } from "shared";
import {
  KyselyDb,
  jsonBuildObject,
  jsonStripNulls,
} from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";

const logger = createLogger(__filename);
export class PgFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  constructor(private transaction: KyselyDb) {}

  public async create(formEstablishment: FormEstablishmentDto): Promise<void> {
    return this.transaction
      .insertInto("form_establishments")
      .values({
        additional_information: formEstablishment.additionalInformation,
        business_addresses: JSON.stringify(formEstablishment.businessAddresses),
        business_contact: sql`CAST(${JSON.stringify(
          formEstablishment.businessContact,
        )} AS JSONB)`,
        business_name_customized: formEstablishment.businessNameCustomized,
        business_name: formEstablishment.businessName,
        fit_for_disabled_workers:
          formEstablishment.fitForDisabledWorkers ?? null,
        is_engaged_enterprise: formEstablishment.isEngagedEnterprise,
        max_contacts_per_week: formEstablishment.maxContactsPerWeek,
        naf: formEstablishment.naf
          ? JSON.stringify(formEstablishment.naf)
          : null,
        professions: JSON.stringify(formEstablishment.appellations),
        siret: formEstablishment.siret,
        source: formEstablishment.source,
        website: formEstablishment.website,
        next_availability_date: formEstablishment.nextAvailabilityDate,
        searchable_by_job_seekers: formEstablishment.searchableBy.jobSeekers,
        searchable_by_students: formEstablishment.searchableBy.students,
        acquisition_campaign: formEstablishment.acquisitionCampaign,
        acquisition_keyword: formEstablishment.acquisitionKeyword,
      })
      .execute()
      .then((_) => Promise.resolve())
      .catch((error: unknown) => {
        const castedError = castError(error);
        logger.error({
          message: "Cannot save form establishment ",
          error: castedError,
        });
        notifyObjectDiscord({
          _message: `Cannot create form establishment with siret ${formEstablishment.siret}`,
          ...castedError,
        });
        throw new ConflictError(
          `Cannot create form establishment with siret ${formEstablishment.siret}. Error: ${castedError} `,
        );
      });
  }

  public async delete(siret: SiretDto): Promise<void> {
    const results = await this.transaction
      .deleteFrom("form_establishments")
      .where("siret", "=", siret)
      .returning("siret")
      .execute();
    const deletedSiret = results.at(0)?.siret;
    if (deletedSiret !== siret) throw errors.establishment.notFound({ siret });
  }

  public async getAll(): Promise<FormEstablishmentDto[]> {
    const pgResults =
      await this.#selectEstablishmentJsonBuildQueryBuilder().execute();
    return pgResults.map(({ formEstablishment }) =>
      formEstablishmentSchema.parse(formEstablishment),
    );
  }

  public async getBySiret(
    siret: SiretDto,
  ): Promise<FormEstablishmentDto | undefined> {
    const pgResult = await this.#selectEstablishmentJsonBuildQueryBuilder()
      .where("siret", "=", siret)
      .executeTakeFirst();

    return (
      pgResult && formEstablishmentSchema.parse(pgResult.formEstablishment)
    );
  }

  public async update(formEstablishment: FormEstablishmentDto): Promise<void> {
    const result = await this.transaction
      .updateTable("form_establishments")
      .set({
        additional_information: formEstablishment.additionalInformation ?? null, // TO DISCUSS : was missing on not kysely legacy update query
        business_addresses: JSON.stringify(formEstablishment.businessAddresses),
        business_contact: sql`CAST(${JSON.stringify(
          formEstablishment.businessContact,
        )} AS JSONB)`,
        business_name: formEstablishment.businessName,
        business_name_customized:
          formEstablishment.businessNameCustomized ?? null,
        fit_for_disabled_workers:
          formEstablishment.fitForDisabledWorkers ?? null,
        is_engaged_enterprise: formEstablishment.isEngagedEnterprise ?? null,
        max_contacts_per_week: formEstablishment.maxContactsPerWeek,
        naf: formEstablishment.naf
          ? JSON.stringify(formEstablishment.naf)
          : null,
        next_availability_date: formEstablishment.nextAvailabilityDate ?? null,
        professions: JSON.stringify(formEstablishment.appellations),
        source: formEstablishment.source,
        website: formEstablishment.website ?? null, // TO DISCUSS : was missing on not kysely legacy update query
        acquisition_campaign: formEstablishment.acquisitionCampaign,
        acquisition_keyword: formEstablishment.acquisitionKeyword,
        searchable_by_job_seekers: formEstablishment.searchableBy.jobSeekers,
        searchable_by_students: formEstablishment.searchableBy.students,
      })
      .where("siret", "=", formEstablishment.siret)
      .returning("siret")
      .execute();

    if (result.at(0)?.siret !== formEstablishment.siret)
      throw errors.establishment.conflictError({
        siret: formEstablishment.siret,
      });
  }

  #selectEstablishmentJsonBuildQueryBuilder() {
    return this.transaction.selectFrom("form_establishments").select((db) => [
      jsonStripNulls(
        jsonBuildObject({
          additionalInformation: db.ref("additional_information"),
          appellations: db.ref("professions"),
          businessAddresses: db.ref("business_addresses"),
          businessContact: db.ref("business_contact"),
          businessName: db.ref("business_name"),
          businessNameCustomized: db.ref("business_name_customized"),
          fitForDisabledWorkers: db.ref("fit_for_disabled_workers"),
          isEngagedEnterprise: db.ref("is_engaged_enterprise"),
          maxContactsPerWeek: db.ref("max_contacts_per_week"),
          naf: db.ref("naf"),
          siret: db.ref("siret"),
          source: db.ref("source"),
          website: db.ref("website"),
          nextAvailabilityDate: sql<DateString>`date_to_iso(next_availability_date)`,
          searchableBy: jsonBuildObject({
            jobSeekers: db.ref("searchable_by_job_seekers"),
            students: db.ref("searchable_by_students"),
          }),
        }),
      ).as("formEstablishment"),
    ]);
  }
}
