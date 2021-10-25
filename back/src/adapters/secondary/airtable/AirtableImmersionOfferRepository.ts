import Airtable, { FieldSet, Record, Table } from "airtable";
import { QueryParams } from "airtable/lib/query_params";
import { FormEstablishmentRepository } from "../../../domain/immersionOffer/ports/FormEstablishmentRepository";
import {
  BusinessContactDto,
  ContactMethod,
  FormEstablishmentDto,
  FormEstablishmentId,
} from "../../../shared/FormEstablishmentDto";
import { NafDto } from "../../../shared/naf";
import { ProfessionDto } from "../../../shared/rome";
import { createLogger } from "../../../utils/logger";
import { AirtableTableConfig } from "../../primary/appConfig";
import { ConflictError } from "../../primary/helpers/sendHttpResponse";

const logger = createLogger(__filename);

export type AirtableFormEstablishmentDataConverterWithDto = {
  dtoToFieldSet: (entity: FormEstablishmentDto) => FieldSet;
  fieldSetToDto: (fields: FieldSet) => FormEstablishmentDto;
};

const readString = (fields: FieldSet, fieldName: string): string => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Inavlid field "${fieldName}": ${value}`);
  return value;
};

const readBussinessContactsFromJSON = (
  fields: FieldSet,
  fieldName: string,
): BusinessContactDto[] => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Invalid field "${fieldName}": ${value}`);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(
      "String is not a valid JSON for an array of Business Contact",
    );
  }
};

const readJobsFromJSON = (
  fields: FieldSet,
  fieldName: string,
): ProfessionDto[] => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Invalid field "${fieldName}": ${value}`);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("String is not a valid JSON for an array of Jobs");
  }
};

const readNafFromJson = (fields: FieldSet, fieldName: string): NafDto => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Invalid field "${fieldName}": ${value}`);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("String is not a valid JSON for a NAF");
  }
};

const readContactMethodFromJSON = (
  fields: FieldSet,
  fieldName: string,
): ContactMethod[] => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Invalid field "${fieldName}": ${value}`);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("String is not a valid JSON for an array of Jobs");
  }
};

export const formEstablishmentDataConverter: AirtableFormEstablishmentDataConverterWithDto =
  {
    dtoToFieldSet: (dto: FormEstablishmentDto): FieldSet => ({
      ...dto,
      naf: JSON.stringify(dto.naf),
      businessContacts: JSON.stringify(dto.businessContacts),
      professions: JSON.stringify(dto.professions),
      preferredContactMethods: JSON.stringify(dto.preferredContactMethods),
    }),

    fieldSetToDto: (fields: FieldSet): FormEstablishmentDto => ({
      id: readString(fields, "id"),
      businessName: readString(fields, "businessName"),
      businessAddress: readString(fields, "businessAddress"),
      businessContacts: readBussinessContactsFromJSON(
        fields,
        "businessContacts",
      ),
      siret: readString(fields, "siret"),
      preferredContactMethods: readContactMethodFromJSON(
        fields,
        "preferredContactMethods",
      ),
      naf: readNafFromJson(fields, "naf"),
      professions: readJobsFromJSON(fields, "professions"),
    }),
  };

export class AirtableFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  constructor(
    readonly table: Table<FieldSet>,
    readonly converter: AirtableFormEstablishmentDataConverterWithDto,
  ) {}

  public static create(
    config: AirtableTableConfig,
    converter: AirtableFormEstablishmentDataConverterWithDto,
  ) {
    return new AirtableFormEstablishmentRepository(
      new Airtable({ apiKey: config.apiKey }).base(config.baseId)(
        config.tableName,
      ),
      converter,
    );
  }

  public async save(
    dto: FormEstablishmentDto,
  ): Promise<FormEstablishmentId | undefined> {
    if (await this.getById(dto.id)) {
      throw new ConflictError(`ID already exists: ${dto.id}`);
    }

    try {
      logger.debug(this.table.name, "Table Name");
      logger.debug(this.converter.dtoToFieldSet(dto), "Coverted Dto");
      const response = await this.table.create([
        {
          fields: this.converter.dtoToFieldSet(dto),
        },
      ]);
      if (response.length < 1) {
        throw new Error("Unexpected response length.");
      }
      return dto.id;
    } catch (e: any) {
      logger.error(e, `Error creating Airtable record: ${dto.id}`);
      throw e;
    }
  }

  public async getById(
    id: FormEstablishmentId,
  ): Promise<FormEstablishmentDto | undefined> {
    const record = await this.queryRecordById(id);
    if (!record) {
      return;
    }
    return this.converter.fieldSetToDto(record.fields);
  }

  public async getAll(): Promise<FormEstablishmentDto[]> {
    try {
      const records = await this.queryRecords({});
      return records.map((record) =>
        this.converter.fieldSetToDto(record.fields),
      );
    } catch (e: any) {
      logger.error(e, "Error fetching all airtable records.");
      throw e;
    }
  }

  private async queryRecordById(
    id: FormEstablishmentId,
  ): Promise<Record<FieldSet> | undefined> {
    try {
      const demandesImmersion = await this.queryRecords({
        maxRecords: 1,
        filterByFormula: `id="${id}"`,
      });
      if (demandesImmersion.length < 1) {
        return undefined;
      }
      return demandesImmersion[0];
    } catch (e: any) {
      logger.error(e, `Error fetching Airtable record: ${id}`);
      throw e;
    }
  }

  private async queryRecords(
    params: QueryParams<FieldSet>,
  ): Promise<Record<FieldSet>[]> {
    const allRecords: Record<FieldSet>[] = [];
    await this.table.select(params).eachPage((records, fetchNextPage) => {
      records.forEach((record) => allRecords.push(record));
      fetchNextPage();
    });
    return allRecords;
  }
}
