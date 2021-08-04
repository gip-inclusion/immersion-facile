import Airtable, { Table, FieldSet } from "airtable";
import moment from "moment";
import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";

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

  public async save(entity: FormulaireEntity): Promise<void> {
    await this.table.create([
      {
        fields: {
          email: entity.email,
          dateStart: moment(entity.dateStart).format("YYYY-MM-DD"),
          dateEnd: moment(entity.dateEnd).format("YYYY-MM-DD"),
        },
      },
    ]);
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
      return FormulaireEntity.create({
        email: record.fields.email,
        dateStart: new Date(record.fields.dateStart),
        dateEnd: new Date(record.fields.dateEnd),
      });
    });
  }
}
