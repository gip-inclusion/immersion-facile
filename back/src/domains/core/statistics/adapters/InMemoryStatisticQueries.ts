import { DataWithPagination } from "shared";
import { StatisticQueries } from "../ports/StatisticQueries";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export const fakeEstablishmentStatsResponse: DataWithPagination<EstablishmentStat> =
  {
    data: [
      {
        siret: "420000000042",
        name: "My fake establishment",
        numberOfConventions: 3,
        isReferenced: true,
      },
    ],
    pagination: {
      totalRecords: 1,
      totalPages: 1,
      numberPerPage: 10,
      currentPage: 1,
    },
  };

export class InMemoryStatisticQueries implements StatisticQueries {
  public async getEstablishmentStats(_paginationParams: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>> {
    return fakeEstablishmentStatsResponse;
  }
}
