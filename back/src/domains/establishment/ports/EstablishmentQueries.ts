import { DataWithPagination } from "shared";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export interface EstablishmentQueries {
  getEstablishmentStats(pagination: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>>;
}
