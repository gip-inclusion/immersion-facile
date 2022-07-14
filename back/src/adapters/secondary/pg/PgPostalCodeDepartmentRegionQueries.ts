import { PoolClient } from "pg";
import {
  DepartmentAndRegion,
  PostalCodeDepartmentRegionQueries,
} from "../../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";

export class PgPostalCodeDepartmentRegionQueries
  implements PostalCodeDepartmentRegionQueries
{
  constructor(private client: PoolClient) {}

  public async getAllRegionAndDepartmentByPostalCode(): Promise<
    Record<string[5], DepartmentAndRegion>
  > {
    const pgResult = await this.client.query(`
      SELECT *
      FROM postal_code_department_region
      `);

    const record: Record<string[5], DepartmentAndRegion> = {};

    pgResult.rows.map(
      (row) =>
        (record[row.postal_code] = {
          department: row.department,
          region: row.region,
        }),
    );

    return record;
  }
}
