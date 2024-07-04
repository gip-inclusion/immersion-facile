import { DataWithPagination } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { EstablishmentQueries } from "../ports/EstablishmentQueries";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export class PgEstablishmentQueries implements EstablishmentQueries {
  constructor(private transaction: KyselyDb) {}

  public async getEstablishmentStats(_pagination: {
    page: number;
    perPage: number;
  }): Promise<DataWithPagination<EstablishmentStat>> {
    throw new Error("Method not implemented.");
  }
}
