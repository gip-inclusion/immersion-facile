import { PoolClient } from "pg";
import format from "pg-format";
import { groupBy, keys, prop } from "ramda";
import { ExportableName, GetExportableParams } from "shared/src/exportable";
import { ComplexScheduleDto } from "shared/src/schedule/Schedule.dto";
import {
  calculateTotalImmersionHoursFromComplexSchedule,
  prettyPrintComplexSchedule,
} from "shared/src/schedule/ScheduleUtils";
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
      format(
        `unaccent("${filterKey}") ILIKE unaccent(%1$L)`,
        "%" + exportable.filters[filterKey] + "%",
      ),
    );

    const whereClause =
      filtersSQL.length > 0 ? `WHERE ${filtersSQL.join(" AND ")}` : "";
    const queryResult = await this.client.query(
      `SELECT * FROM view_${exportable.name}
       ${whereClause}`,
    );

    const postProcessors = postProcessing[exportable.name];

    const processedRows = postProcessors
      ? queryResult.rows.map((row) => ({ ...row, ...postProcessors(row) }))
      : queryResult.rows;

    if (!exportable.keyToGroupBy)
      return {
        [exportable.name]: processedRows,
      };
    else {
      return groupBy(prop(exportable.keyToGroupBy), processedRows);
    }
  }
}

const postProcessing: Partial<
  Record<ExportableName, (row: ExportedRow) => ExportedRow>
> = {
  conventions: (row: ExportedRow) => ({
    ...row,
    Programme: prettyPrintComplexSchedule(
      row["Programme"] as ComplexScheduleDto,
    ),
    "Durée de l'immersion": calculateTotalImmersionHoursFromComplexSchedule(
      row["Programme"] as ComplexScheduleDto,
    ),
  }),
};
