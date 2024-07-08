import { DataWithPagination } from "shared";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export interface StatisticQueries {
  getEstablishmentStats(pagination: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>>;
}
