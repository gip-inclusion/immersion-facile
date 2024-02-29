import { andThen } from "ramda";
import { ConventionReadDto, filter, pipeWithValue } from "shared";
import { KyselyDb } from "../../../adapters/secondary/pg/kysely/kyselyUtils";
import { validateConventionReadResults } from "../../convention/adapters/PgConventionQueries";
import {
  createConventionReadQueryBuilder,
  makeGetLastConventionWithSiretInList,
} from "../../convention/adapters/pgConventionSql";
import { isSiretsListFilled } from "../entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../ports/EstablishmentLeadQueries";
import { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";
import { getEstablishmentLeadSiretsByUniqLastEventKindBuilder } from "./PgEstablishmentLeadRepository";

export class PgEstablishmentLeadQueries implements EstablishmentLeadQueries {
  constructor(private transaction: KyselyDb) {}

  public async getLastConventionsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<ConventionReadDto[]> {
    const withSiretList =
      await getEstablishmentLeadSiretsByUniqLastEventKindBuilder(
        this.transaction,
        params,
      ).execute();

    const sirets = withSiretList.map(({ siret }) => siret);

    if (!isSiretsListFilled(sirets)) return [];

    return pipeWithValue(
      createConventionReadQueryBuilder(this.transaction),
      makeGetLastConventionWithSiretInList(sirets),
      (builder) => builder.execute(),
      andThen(filter((conv) => conv.rn === "1")),
      andThen(validateConventionReadResults),
    );
  }
}
