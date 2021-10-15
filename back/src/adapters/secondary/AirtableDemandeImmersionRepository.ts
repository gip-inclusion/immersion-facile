import Airtable, { FieldSet, Record, Table } from "airtable";
import { QueryParams } from "airtable/lib/query_params";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import { createLogger } from "../../utils/logger";
import { AirtableTableConfig } from "../primary/appConfig";
import { ConflictError } from "../primary/helpers/sendHttpResponse";

const logger = createLogger(__filename);

export type AirtableApplicationDataConverter = {
  entityToFieldSet: (entity: ImmersionApplicationEntity) => FieldSet;
  fieldSetToEntity: (fields: FieldSet) => ImmersionApplicationEntity;
};

export class AirtableDemandeImmersionRepository
  implements ImmersionApplicationRepository
{
  constructor(
    readonly table: Table<FieldSet>,
    readonly converter: AirtableApplicationDataConverter,
  ) {}

  public static create(
    config: AirtableTableConfig,
    converter: AirtableApplicationDataConverter,
  ) {
    return new AirtableDemandeImmersionRepository(
      new Airtable({ apiKey: config.apiKey }).base(config.baseId)(
        config.tableName,
      ),
      converter,
    );
  }

  public async save(
    entity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    if (await this.getById(entity.id)) {
      throw new ConflictError(`ID already exists: ${entity.id}`);
    }

    try {
      const response = await this.table.create([
        {
          fields: this.converter.entityToFieldSet(entity),
        },
      ]);
      if (response.length < 1) {
        throw new Error("Unexpected response length.");
      }
      return entity.id;
    } catch (e: any) {
      logger.error(e, `Error creating Airtable record: ${entity.id}`);
      throw e;
    }
  }

  public async getById(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationEntity | undefined> {
    const record = await this.queryRecordById(id);
    if (!record) {
      return undefined;
    }
    return this.converter.fieldSetToEntity(record.fields);
  }

  public async getAll(): Promise<ImmersionApplicationEntity[]> {
    try {
      const records = await this.queryRecords({});
      return records.map((record) =>
        this.converter.fieldSetToEntity(record.fields),
      );
    } catch (e: any) {
      logger.error(e, "Error fetching all airtable records.");
      throw e;
    }
  }

  private async queryRecordById(
    id: ImmersionApplicationId,
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

  public async updateImmersionApplication(
    demandeImmersion: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    const currentRecord = await this.queryRecordById(demandeImmersion.id);
    if (!currentRecord) {
      return undefined;
    }

    try {
      await this.table.update(
        currentRecord.id,
        this.converter.entityToFieldSet(demandeImmersion),
      );
      return demandeImmersion.id;
    } catch (e: any) {
      logger.error(e, `Error updating Airtable record: ${currentRecord.id}`);
      throw e;
    }
  }
}
