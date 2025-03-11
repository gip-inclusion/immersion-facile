import type { ConventionReadDto } from "shared";
import type { InMemoryConventionQueries } from "../../convention/adapters/InMemoryConventionQueries";
import { isSiretsListFilled } from "../entities/EstablishmentLeadEntity";
import type {
  EstablishmentLeadQueries,
  GetLastConventionsByUniqLastEventKindParams,
} from "../ports/EstablishmentLeadQueries";
import type { InMemoryEstablishmentLeadRepository } from "./InMemoryEstablishmentLeadRepository";

export class InMemoryEstablishmentLeadQueries
  implements EstablishmentLeadQueries
{
  constructor(
    private readonly establishmentLeadRepository: InMemoryEstablishmentLeadRepository,
    private readonly conventionQueries: InMemoryConventionQueries,
  ) {}

  public async getLastConventionsByUniqLastEventKind(
    params: GetLastConventionsByUniqLastEventKindParams,
  ): Promise<ConventionReadDto[]> {
    const sirets =
      await this.establishmentLeadRepository.getSiretsByUniqLastEventKind(
        params,
      );
    return isSiretsListFilled(sirets)
      ? this.conventionQueries.getLatestConventionBySirets(sirets)
      : [];
  }
}
