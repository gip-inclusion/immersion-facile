import type { DataWithPagination, PaginationQueryParams } from "shared";
import type { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export interface StatisticQueries {
  getEstablishmentStats(
    pagination: Required<PaginationQueryParams>,
  ): Promise<DataWithPagination<EstablishmentStat>>;
}
