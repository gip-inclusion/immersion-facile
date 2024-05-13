import { andThen } from "ramda";
import { ConventionDto, filter, pipeWithValue } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { validateConventionResults } from "../../convention/adapters/PgConventionQueries";
import {
  createConventionQueryBuilder,
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
  ): Promise<ConventionDto[]> {
    const withSiretList =
      await getEstablishmentLeadSiretsByUniqLastEventKindBuilder(
        this.transaction,
        params,
      ).execute();

    const sirets = withSiretList.map(({ siret }) => siret);

    if (!isSiretsListFilled(sirets)) return [];

    return pipeWithValue(
      createConventionQueryBuilder(this.transaction),
      makeGetLastConventionWithSiretInList(sirets),
      (builder) => builder.execute(),
      andThen(filter((conv) => conv.rn === "1")),
      andThen(validateConventionResults),
    );
  }
}
