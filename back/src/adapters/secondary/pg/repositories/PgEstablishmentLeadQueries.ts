import { andThen, map } from "ramda";
import { ConventionReadDto, filter, pipeWithValue } from "shared";
import { isSiretsListFilled } from "../../../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../../../../domain/offer/ports/EstablishmentLeadQueries";
import { KyselyDb } from "../kysely/kyselyUtils";
import { validateConventionReadResults } from "./PgConventionQueries";
import { getEstablishmentLeadSiretsByLastEventKindBuilder } from "./PgEstablishmentLeadRepository";
import {
  createConventionReadQueryBuilder,
  makeGetLastConventionWithSiretInList,
} from "./pgConventionSql";

export class PgEstablishmentLeadQueries implements EstablishmentLeadQueries {
  constructor(private transaction: KyselyDb) {}

  public async getLastConventionsByLastEventKind(
    kind:
      | "to-be-reminded"
      | "reminder-sent"
      | "registration-accepted"
      | "registration-refused",
  ): Promise<ConventionReadDto[]> {
    const withSiretList =
      await getEstablishmentLeadSiretsByLastEventKindBuilder(
        this.transaction,
        kind,
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
