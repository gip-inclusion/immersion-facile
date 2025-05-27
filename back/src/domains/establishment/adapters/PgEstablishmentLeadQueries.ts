import { sql } from "kysely";
import { andThen } from "ramda";
import { type ConventionDto, filter, pipeWithValue } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { validateConventionResults } from "../../convention/adapters/PgConventionQueries";
import {
  createConventionQueryBuilder,
  makeGetLastConventionWithSiretInList,
} from "../../convention/adapters/pgConventionSql";
import { isSiretsListFilled } from "../entities/EstablishmentLeadEntity";
import type {
  EstablishmentLeadQueries,
  GetLastConventionsByUniqLastEventKindParams,
} from "../ports/EstablishmentLeadQueries";
import { getEstablishmentLeadSiretsByUniqLastEventKindBuilder } from "./PgEstablishmentLeadRepository";

export class PgEstablishmentLeadQueries implements EstablishmentLeadQueries {
  constructor(private transaction: KyselyDb) {}

  public async getLastConventionsByUniqLastEventKind(
    params: GetLastConventionsByUniqLastEventKindParams,
  ): Promise<ConventionDto[]> {
    const withSiretList =
      await getEstablishmentLeadSiretsByUniqLastEventKindBuilder(
        this.transaction,
        params,
      )
        .limit(params.maxResults)
        .execute();

    const sirets = withSiretList.map(({ siret }) => siret);

    if (!isSiretsListFilled(sirets)) return [];

    return pipeWithValue(
      createConventionQueryBuilder(this.transaction),
      makeGetLastConventionWithSiretInList(sirets),
      (builder) =>
        builder.where(
          sql`conventions.date_end`,
          ">",
          params.conventionEndDateGreater,
        ),
      (builder) => builder.execute(),
      andThen(filter((conv) => conv.rn === "1")),
      andThen(validateConventionResults),
    );
  }
}
