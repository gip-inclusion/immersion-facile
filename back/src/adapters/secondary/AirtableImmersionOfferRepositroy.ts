import { QueryParams } from "airtable/lib/query_params";
import { ImmersionOfferRepository } from "../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  BusinessContactDto,
  ContactMethod,
  ImmersionOfferDto,
  ImmersionOfferId,
} from "../../shared/ImmersionOfferDto";
import { NafSectorCode } from "../../shared/naf";
import { ProfessionDto } from "../../shared/rome";
import Airtable, { FieldSet, Record, Table } from "airtable";
import { ConflictError } from "../primary/helpers/sendHttpResponse";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type AirtableImmersionOfferDataConverterWithDto = {
  dtoToFieldSet: (entity: ImmersionOfferDto) => FieldSet;
  fieldSetToDto: (fields: FieldSet) => ImmersionOfferDto;
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

export const immersionOfferDataConverter: AirtableImmersionOfferDataConverterWithDto =
  {
    dtoToFieldSet: (dto: ImmersionOfferDto): FieldSet => {
      return {
        ...dto,
        businessContacts: JSON.stringify(dto.businessContacts),
        professions: JSON.stringify(dto.professions),
        preferredContactMethods: JSON.stringify(dto.preferredContactMethods),
      };
    },

    fieldSetToDto: (fields: FieldSet): ImmersionOfferDto => {
      const immersionDto: ImmersionOfferDto = {
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
        businessSectorCode: readString(
          fields,
          "businessSectorCode",
        ) as NafSectorCode,
        professions: readJobsFromJSON(fields, "professions"),
      };
      return immersionDto;
    },
  };

export class AirtableImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private readonly logger = logger.child({
    logsource: "AirtableImmersionOfferRepository",
  });

  constructor(
    readonly table: Table<FieldSet>,
    readonly converter: AirtableImmersionOfferDataConverterWithDto,
  ) {}

  public static create(
    apiKey: string,
    baseId: string,
    tableName: string,
    converter: AirtableImmersionOfferDataConverterWithDto,
  ) {
    return new AirtableImmersionOfferRepository(
      new Airtable({ apiKey }).base(baseId)(tableName),
      converter,
    );
  }

  public async save(
    dto: ImmersionOfferDto,
  ): Promise<ImmersionOfferId | undefined> {
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
      this.logger.error(e, `Error creating Airtable record: ${dto.id}`);
      throw e;
    }
  }

  public async getById(
    id: ImmersionOfferId,
  ): Promise<ImmersionOfferDto | undefined> {
    const record = await this.queryRecordById(id);
    if (!record) {
      return;
    }
    return this.converter.fieldSetToDto(record.fields);
  }

  public async getAll(): Promise<ImmersionOfferDto[]> {
    try {
      const records = await this.queryRecords({});
      return records.map((record) =>
        this.converter.fieldSetToDto(record.fields),
      );
    } catch (e: any) {
      this.logger.error(e, "Error fetching all airtable records.");
      throw e;
    }
  }

  private async queryRecordById(
    id: ImmersionOfferId,
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
      this.logger.error(e, `Error fetching Airtable record: ${id}`);
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
