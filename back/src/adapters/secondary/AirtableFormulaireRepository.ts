import Airtable, { Table, FieldSet } from "airtable";
import moment from "moment";
import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";
import { FormulaireIdEntity } from "../../domain/formulaires/entities/FormulaireIdEntity";

export class AirtableFormulaireRepository implements FormulaireRepository {
  private readonly table: Table<FieldSet>;

  constructor(table: Table<FieldSet>) {
    this.table = table;
  }

  public static create(apiKey: string, baseId: string, tableName: string) {
    return new AirtableFormulaireRepository(
      new Airtable({ apiKey }).base(baseId)(tableName)
    );
  }

  public async save(entity: FormulaireEntity): Promise<FormulaireIdEntity> {
    return this.table.create([
      {
        fields: {
          email: entity.email,
          phone: entity.phone,
          firstName: entity.firstName,
          lastName: entity.lastName,
          dateStart: moment(entity.dateStart).format("YYYY-MM-DD"),
          dateEnd: moment(entity.dateEnd).format("YYYY-MM-DD"),
          businessName: entity.businessName,
          siret: entity.siret,
          mentor: entity.mentor,
          mentorPhone: entity.mentorPhone,
          mentorEmail: entity.mentorEmail,
          workdays: entity.workdays,
          workHours: entity.workHours,
          immersionAddress: entity.immersionAddress,
          individualProtection: entity.individualProtection,
          sanitaryPrevention: entity.sanitaryPrevention,
          sanitaryPreventionDescription: entity.sanitaryPreventionDescription,
          immersionObjective: entity.immersionObjective,
          immersionProfession: entity.immersionProfession,
          immersionActivities: entity.immersionActivities,
          immersionSkills: entity.immersionSkills,
          beneficiaryAccepted: entity.beneficiaryAccepted,
          enterpriseAccepted: entity.enterpriseAccepted,
        },
      }
    ]).then((response) => {
        if (response.length < 1) {
          throw new Error(
            `Unexpected response length during creation of Airtable record: ${response}`
          );
        }
        return FormulaireIdEntity.create(response[0].id);
      });
  }

  private isArrayOfStrings(value: any): boolean {
    return Array.isArray(value) && value.every(item => typeof item === "string");
  }

  public async getAllFormulaires(): Promise<FormulaireEntity[]> {
    const allRecords: Airtable.Record<Airtable.FieldSet>[] = [];
    await this.table.select().eachPage((records, fetchNextPage) => {
      records.forEach((record) => allRecords.push(record));
      fetchNextPage();
    });

    return allRecords.map((record) => {

      if (!(typeof record.fields.email === "string")) {
        throw new Error(
          `Missing or invalid field 'email' in Airtable record: ${record}`
        );
      }
      if (!(!!record.fields.phone && typeof record.fields.phone === "string")) {
        throw new Error(
          `Invalid field 'phone' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.firstName === "string")) {
        throw new Error(
          `Missing or invalid field 'firstName' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.lastName === "string")) {
        throw new Error(
          `Missing or invalid field 'lastName' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.businessName === "string")) {
        throw new Error(
          `Missing or invalid field 'businessName' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.siret === "string")) {
        throw new Error(
          `Missing or invalid field 'siret' in Airtable record: ${record}`
        );
      }

      if (!(typeof record.fields.dateStart === "string")) {
        throw new Error(
          `Missing or invalid field 'dateStart' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.dateEnd === "string")) {
        throw new Error(
          `Missing or invalid field 'dateStart' in Airtable record: ${record}`
        );
      }

      if (!(typeof record.fields.mentor === "string")) {
        throw new Error(
          `Missing or invalid field 'mentor' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.mentorPhone === "string")) {
        throw new Error(
          `Missing or invalid field 'mentorPhone' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.mentorEmail === "string")) {
        throw new Error(
          `Missing or invalid field 'mentorEmail' in Airtable record: ${record}`
        );
      }
      if (!this.isArrayOfStrings(record.fields.workdays)) {
        throw new Error(
          `Missing or invalid field 'workdays' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.workHours === "string")) {
        throw new Error(
          `Missing or invalid field 'workHours' in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.immersionAddress === "string")) {
        throw new Error(
          `Missing or invalid field 'immersionAddress in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.individualProtection === "boolean")) {
        throw new Error(
          `Missing or invalid field 'individualProtection in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.sanitaryPrevention === "boolean")) {
        throw new Error(
          `Missing or invalid field 'sanitaryPrevention in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.sanitaryPreventionDescription === "string")) {
        throw new Error(
          `Missing or invalid field 'siret' in sanitaryPreventionDescription record: ${record}`
        );
      }
      if (!(typeof record.fields.immersionObjective === "string")) {
        throw new Error(
          `Missing or invalid field 'immersionObjective in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.immersionProfession === "string")) {
        throw new Error(
          `Missing or invalid field 'immersionProfession in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.immersionActivities === "string")) {
        throw new Error(
          `Missing or invalid field 'immersionActivities in Airtable record: ${record}`
        );
      }
      if (!(typeof record.fields.immersionSkills === "string")) {
        throw new Error(
          `Missing or invalid field 'immersionSkills in Airtable record: ${record}`
        );
      }

      if (!(typeof record.fields.beneficiaryAccepted === "boolean")) {
        throw new Error(
          `Missing or invalid field 'beneficiaryAccepted in Airtable record: ${record}`
        );
      }

      if (!(typeof record.fields.enterpriseAccepted === "boolean")) {
        throw new Error(
          `Missing or invalid field 'enterpriseAccepted in Airtable record: ${record}`
        );
      }

      return FormulaireEntity.create({
        email: record.fields.email,
        phone: record.fields.phone,
        firstName: record.fields.firstName,
        lastName: record.fields.lastName,
        dateStart: new Date(record.fields.dateStart),
        dateEnd: new Date(record.fields.dateEnd),
        businessName: record.fields.businessName,
        siret: record.fields.siret,
        mentor: record.fields.mentor,
        mentorPhone: record.fields.mentorPhone,
        mentorEmail: record.fields.mentorEmail,
        workdays: record.fields.workdays as string[],
        workHours: record.fields.workHours,
        immersionAddress: record.fields.immersionAddress,
        individualProtection: record.fields.individualProtection,
        sanitaryPrevention: record.fields.sanitaryPrevention,
        sanitaryPreventionDescription: record.fields.sanitaryPreventionDescription,
        immersionObjective: record.fields.immersionObjective,
        immersionProfession: record.fields.immersionProfession,
        immersionActivities: record.fields.immersionActivities,
        immersionSkills: record.fields.immersionSkills,
        beneficiaryAccepted: record.fields.beneficiaryAccepted,
        enterpriseAccepted: record.fields.enterpriseAccepted,
      });
    });
  }
}
