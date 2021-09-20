import Airtable, { FieldSet, Record, Table } from "airtable";
import { QueryParams } from "airtable/lib/query_params";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";
import { logger } from "../../utils/logger";

export type AirtableApplicationDataConverter = {
  entityToFieldSet: (entity: DemandeImmersionEntity) => FieldSet;
  fieldSetToEntity: (fields: FieldSet) => DemandeImmersionEntity;
};

export class AirtableDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private readonly logger = logger.child({
    logsource: "AirtableApplicationRepository",
  });

  constructor(
    readonly table: Table<FieldSet>,
    readonly converter: AirtableApplicationDataConverter
  ) {}

  public static create(
    apiKey: string,
    baseId: string,
    tableName: string,
    converter: AirtableApplicationDataConverter
  ) {
    return new AirtableDemandeImmersionRepository(
      new Airtable({ apiKey }).base(baseId)(tableName),
      converter
    );
  }

  public async save(
    entity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    if (await this.getById(entity.id)) {
      return undefined;
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
      this.logger.error(e, `Error creating Airtable record: ${entity.id}`);
      throw e;
    }
  }

  public async getById(
    id: DemandeImmersionId
  ): Promise<DemandeImmersionEntity | undefined> {
    const record = await this.queryRecordById(id);
    if (!record) {
      return undefined;
    }
    return this.converter.fieldSetToEntity(record.fields);
  }

  public async getAll(): Promise<DemandeImmersionEntity[]> {
    try {
      const records = await this.queryRecords({});
      return records.map((record) =>
        this.converter.fieldSetToEntity(record.fields)
      );
    } catch (e: any) {
      this.logger.error(e, "Error fetching all airtable records.");
      throw e;
    }
  }

  private async queryRecordById(
    id: DemandeImmersionId
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
    params: QueryParams<FieldSet>
  ): Promise<Record<FieldSet>[]> {
    const allRecords: Record<FieldSet>[] = [];
    await this.table.select(params).eachPage((records, fetchNextPage) => {
      records.forEach((record) => allRecords.push(record));
      fetchNextPage();
    });
    return allRecords;
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    const currentRecord = await this.queryRecordById(demandeImmersion.id);
    if (!currentRecord) {
      return undefined;
    }

    try {
      await this.table.update(
        currentRecord.id,
        this.converter.entityToFieldSet(demandeImmersion)
      );
      return demandeImmersion.id;
    } catch (e: any) {
      this.logger.error(
        e,
        `Error updating Airtable record: ${currentRecord.id}`
      );
      throw e;
    }
  }
}
