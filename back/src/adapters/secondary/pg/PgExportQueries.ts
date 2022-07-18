import { PoolClient } from "pg";
import format from "pg-format";
import { groupBy, keys, prop } from "ramda";
import { GetExportableParams } from "shared/src/exportable";
import {
  ExportedRow,
  ExportQueries,
  SheetName,
} from "../../../domain/backoffice/ports/ExportQueries";

export class PgExportQueries implements ExportQueries {
  constructor(private client: PoolClient) {}

  public async getFromExportable(
    exportable: GetExportableParams,
  ): Promise<Record<SheetName, ExportedRow[]>> {
    const filtersSQL = keys(exportable.filters).map((filterKey) =>
      format(`"${filterKey}" ILIKE %1$L`, exportable.filters[filterKey]),
    );

    const whereClause =
      filtersSQL.length > 0 ? `WHERE ${filtersSQL.join(" AND ")}` : "";

    const queryResult = await this.client.query(
      `SELECT * FROM view_${exportable.name}
       ${whereClause}`,
    );
    if (!exportable.keyToGroupBy)
      return {
        [exportable.name]: queryResult.rows,
      };
    else {
      return groupBy(prop(exportable.keyToGroupBy), queryResult.rows); // TODO : filter out groupby column.
    }
  }
}
