import { DataWithPagination } from "shared";
import { StatisticQueries } from "../ports/StatisticQueries";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export class InMemoryStatisticQueries implements StatisticQueries {
  public async getEstablishmentStats(_paginationParams: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>> {
    throw new Error("Method not implemented.");
  }
}
