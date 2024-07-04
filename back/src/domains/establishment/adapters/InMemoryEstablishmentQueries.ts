import { DataWithPagination } from "shared";
import { EstablishmentQueries } from "../ports/EstablishmentQueries";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export class InMemoryEstablishmentQueries implements EstablishmentQueries {
  public async getEstablishmentStats(_paginationParams: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>> {
    throw new Error("Method not implemented.");
  }
}
