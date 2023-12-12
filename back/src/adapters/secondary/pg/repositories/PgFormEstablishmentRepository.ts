import { sql } from "kysely";
import {
  castError,
  FormEstablishmentDto,
  formEstablishmentSchema,
  SiretDto,
} from "shared";
import {
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
  FormEstablishmentRepository,
} from "../../../../domain/offer/ports/FormEstablishmentRepository";
import { createLogger } from "../../../../utils/logger";
import { notifyObjectDiscord } from "../../../../utils/notifyDiscord";
import {
  ConflictError,
  NotFoundError,
} from "../../../primary/helpers/httpErrors";
import {
  jsonBuildObject,
  jsonStripNulls,
  KyselyDb,
} from "../kysely/kyselyUtils";

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
        business_address: formEstablishment.businessAddress,
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
      })
      .execute()
      .then((_) => Promise.resolve())
      .catch((error: unknown) => {
        const castedError = castError(error);
        logger.error({ error: castedError }, "Cannot save form establishment ");
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
    if (deletedSiret !== siret)
      throw new NotFoundError(formEstablishmentNotFoundErrorMessage(siret));
  }

  public async getAll(): Promise<FormEstablishmentDto[]> {
    const pgResults =
      await this.#selectEstablishmentJsonBuildQueryBuilder().execute();
    return pgResults.map((pgResult) =>
      formEstablishmentSchema.parse(pgResult.formEstablishment),
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
        business_address: formEstablishment.businessAddress,
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
        professions: JSON.stringify(formEstablishment.appellations),
        source: formEstablishment.source,
        website: formEstablishment.website ?? null, // TO DISCUSS : was missing on not kysely legacy update query
      })
      .where("siret", "=", formEstablishment.siret)
      .returning("siret")
      .execute();

    if (result.at(0)?.siret !== formEstablishment.siret)
      throw new ConflictError(
        formEstablishementUpdateFailedErrorMessage(formEstablishment),
      );
  }

  #selectEstablishmentJsonBuildQueryBuilder() {
    return this.transaction.selectFrom("form_establishments").select((db) => [
      jsonStripNulls(
        jsonBuildObject({
          additionalInformation: db.ref("additional_information"),
          appellations: db.ref("professions"),
          businessAddress: db.ref("business_address"),
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
        }),
      ).as("formEstablishment"),
    ]);
  }
}
