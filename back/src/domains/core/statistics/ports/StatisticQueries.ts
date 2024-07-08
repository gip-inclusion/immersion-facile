import { DataWithPagination, PaginationQueryParams } from "shared";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export interface StatisticQueries {
  getEstablishmentStats(
    pagination: Required<PaginationQueryParams>,
  ): Promise<DataWithPagination<EstablishmentStat>>;
}
