import Airtable, { Table, FieldSet } from "airtable";
import { QueryParams } from "airtable/lib/query_params";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { logger } from "../../utils/logger";
import {
  DemandeImmersionId,
  demandeImmersionStatusFromString,
} from "../../shared/DemandeImmersionDto";

export class AirtableDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private readonly table: Table<FieldSet>;

  constructor(table: Table<FieldSet>) {
    this.table = table;
  }

  public static create(apiKey: string, baseId: string, tableName: string) {
    return new AirtableDemandeImmersionRepository(
      new Airtable({ apiKey }).base(baseId)(tableName)
    );
  }

  public async save(
    entity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    if (await this.getById(entity.id)) {
      return undefined;
    }
    const response = await this.table.create([
      {
        fields:
          AirtableDemandeImmersionRepository.convertEntityToFieldSet(entity),
      },
    ]);
    if (response.length < 1) {
      throw new Error(
        `Unexpected response length during creation of Airtable record: ${response}`
      );
    }
    return entity.id;
  }

  public async getById(
    id: DemandeImmersionId
  ): Promise<DemandeImmersionEntity | undefined> {
    try {
      const demandesImmersion = await this.query({
        maxRecords: 1,
        filterByFormula: `id="${id}"`,
      });
      if (demandesImmersion.length < 1) {
        return undefined;
      }
      return demandesImmersion[0];
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }

  public async getAll(): Promise<DemandeImmersionEntity[]> {
    return this.query({});
  }

  private async query(
    params: QueryParams<FieldSet>
  ): Promise<DemandeImmersionEntity[]> {
    const allRecords: Airtable.Record<Airtable.FieldSet>[] = [];
    await this.table.select(params).eachPage((records, fetchNextPage) => {
      records.forEach((record) => allRecords.push(record));
      fetchNextPage();
    });

    return allRecords.map(
      AirtableDemandeImmersionRepository.verifyRecordAndConvertToEntity
    );
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    return this.table
      .update(
        demandeImmersion.id,
        AirtableDemandeImmersionRepository.convertEntityToFieldSet(
          demandeImmersion
        )
      )
      .then((response) => response.id)
      .catch((e) => {
        logger.error(e);
        return undefined;
      });
  }

  private static isArrayOfStrings(value: any): boolean {
    return (
      Array.isArray(value) && value.every((item) => typeof item === "string")
    );
  }

  private static verifyRecordAndConvertToEntity(
    record: Airtable.Record<FieldSet>
  ): DemandeImmersionEntity {
    record.fields.id = record.fields.id || "";
    if (typeof record.fields.id !== "string") {
      throw new Error(`Invalid field 'id' in Airtable record: ${record}`);
    }
    record.fields.status = record.fields.status || "";
    if (typeof record.fields.status !== "string") {
      throw new Error(`Invalid field 'email' in Airtable record: ${record}`);
    }

    record.fields.email = record.fields.email || "";
    if (typeof record.fields.email !== "string") {
      throw new Error(`Invalid field 'email' in Airtable record: ${record}`);
    }

    record.fields.phone = record.fields.phone || "";
    if (typeof record.fields.phone !== "string") {
      throw new Error(`Invalid field 'phone' in Airtable record: ${record}`);
    }

    record.fields.firstName = record.fields.firstName || "";
    if (typeof record.fields.firstName !== "string") {
      throw new Error(
        `Invalid field 'firstName' in Airtable record: ${record}`
      );
    }

    record.fields.lastName = record.fields.lastName || "";
    if (typeof record.fields.lastName !== "string") {
      throw new Error(`Invalid field 'lastName' in Airtable record: ${record}`);
    }

    record.fields.businessName = record.fields.businessName || "";
    if (typeof record.fields.businessName !== "string") {
      throw new Error(
        `Invalid field 'businessName' in Airtable record: ${record}`
      );
    }

    record.fields.siret = record.fields.siret || "";
    if (typeof record.fields.siret !== "string") {
      throw new Error(`Invalid field 'siret' in Airtable record: ${record}`);
    }

    record.fields.dateSubmission = record.fields.dateSubmission || "";
    if (typeof record.fields.dateSubmission !== "string") {
      throw new Error(
        `Invalid field 'dateSubmission' in Airtable record: ${record}`
      );
    }

    record.fields.dateStart = record.fields.dateStart || "";
    if (typeof record.fields.dateStart !== "string") {
      throw new Error(
        `Invalid field 'dateStart' in Airtable record: ${record}`
      );
    }

    record.fields.dateEnd = record.fields.dateEnd || "";
    if (typeof record.fields.dateEnd !== "string") {
      throw new Error(
        `Invalid field 'dateStart' in Airtable record: ${record}`
      );
    }

    record.fields.mentor = record.fields.mentor || "";
    if (typeof record.fields.mentor !== "string") {
      throw new Error(`Invalid field 'mentor' in Airtable record: ${record}`);
    }

    record.fields.mentorPhone = record.fields.mentorPhone || "";
    if (typeof record.fields.mentorPhone !== "string") {
      throw new Error(
        `Invalid field 'mentorPhone' in Airtable record: ${record}`
      );
    }

    record.fields.mentorEmail = record.fields.mentorEmail || "";
    if (typeof record.fields.mentorEmail !== "string") {
      throw new Error(
        `Invalid field 'mentorEmail' in Airtable record: ${record}`
      );
    }

    record.fields.schedule = record.fields.schedule || "";
    if (typeof record.fields.schedule !== "string") {
      throw new Error(`Invalid field 'schedule' in Airtable record: ${record}`);
    }

    record.fields.immersionAddress = record.fields.immersionAddress || "";
    if (typeof record.fields.immersionAddress !== "string") {
      throw new Error(
        `Invalid field 'immersionAddress in Airtable record: ${record}`
      );
    }

    record.fields.individualProtection =
      record.fields.individualProtection || false;
    if (typeof record.fields.individualProtection !== "boolean") {
      throw new Error(
        `Invalid field 'individualProtection in Airtable record: ${record}`
      );
    }

    record.fields.sanitaryPrevention =
      record.fields.sanitaryPrevention || false;
    if (typeof record.fields.sanitaryPrevention !== "boolean") {
      throw new Error(
        `Invalid field 'sanitaryPrevention in Airtable record: ${record}`
      );
    }

    record.fields.sanitaryPreventionDescription =
      record.fields.sanitaryPreventionDescription || "";
    if (typeof record.fields.sanitaryPreventionDescription !== "string") {
      throw new Error(
        `Invalid field 'siret' in sanitaryPreventionDescription record: ${record}`
      );
    }

    record.fields.immersionObjective = record.fields.immersionObjective || "";
    if (typeof record.fields.immersionObjective !== "string") {
      throw new Error(
        `Invalid field 'immersionObjective in Airtable record: ${record}`
      );
    }

    record.fields.immersionProfession = record.fields.immersionProfession || "";
    if (typeof record.fields.immersionProfession !== "string") {
      throw new Error(
        `Invalid field 'immersionProfession in Airtable record: ${record}`
      );
    }

    record.fields.immersionActivities = record.fields.immersionActivities || "";
    if (typeof record.fields.immersionActivities !== "string") {
      throw new Error(
        `Invalid field 'immersionActivities in Airtable record: ${record}`
      );
    }

    record.fields.immersionSkills = record.fields.immersionSkills || "";
    if (typeof record.fields.immersionSkills !== "string") {
      throw new Error(
        `Invalid field 'immersionSkills in Airtable record: ${record}`
      );
    }

    record.fields.beneficiaryAccepted =
      record.fields.beneficiaryAccepted || false;
    if (typeof record.fields.beneficiaryAccepted !== "boolean") {
      throw new Error(
        `Invalid field 'beneficiaryAccepted in Airtable record: ${record}`
      );
    }

    record.fields.enterpriseAccepted =
      record.fields.enterpriseAccepted || false;
    if (typeof record.fields.enterpriseAccepted !== "boolean") {
      throw new Error(
        `Invalid field 'enterpriseAccepted in Airtable record: ${record}`
      );
    }

    return DemandeImmersionEntity.create({
      id: record.fields.id,
      status: demandeImmersionStatusFromString(record.fields.status),
      email: record.fields.email,
      phone: record.fields.phone,
      firstName: record.fields.firstName,
      lastName: record.fields.lastName,
      dateSubmission: record.fields.dateSubmission,
      dateStart: record.fields.dateStart,
      dateEnd: record.fields.dateEnd,
      businessName: record.fields.businessName,
      siret: record.fields.siret,
      mentor: record.fields.mentor,
      mentorPhone: record.fields.mentorPhone,
      mentorEmail: record.fields.mentorEmail,
      schedule: JSON.parse(record.fields.schedule),
      immersionAddress: record.fields.immersionAddress,
      individualProtection: record.fields.individualProtection,
      sanitaryPrevention: record.fields.sanitaryPrevention,
      sanitaryPreventionDescription:
        record.fields.sanitaryPreventionDescription,
      immersionObjective: record.fields.immersionObjective,
      immersionProfession: record.fields.immersionProfession,
      immersionActivities: record.fields.immersionActivities,
      immersionSkills: record.fields.immersionSkills,
      beneficiaryAccepted: record.fields.beneficiaryAccepted,
      enterpriseAccepted: record.fields.enterpriseAccepted,
    });
  }

  private static convertEntityToFieldSet(
    entity: DemandeImmersionEntity
  ): FieldSet {
    const demandeImmersionDto = entity.toDto();

    return {
      ...demandeImmersionDto,
      schedule: JSON.stringify(demandeImmersionDto.schedule),
    } as FieldSet;
  }
}
