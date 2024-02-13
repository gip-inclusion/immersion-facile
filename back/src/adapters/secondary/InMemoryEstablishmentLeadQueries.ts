import { ConventionReadDto } from "shared";
import { ConventionQueries } from "../../domain/convention/ports/ConventionQueries";
import {
  EstablishmentLeadEventKind,
  isSiretsListFilled,
} from "../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../../domain/offer/ports/EstablishmentLeadQueries";
import { InMemoryEstablishmentLeadRepository } from "./offer/InMemoryEstablishmentLeadRepository";

export class InMemoryEstablishmentLeadQueries
  implements EstablishmentLeadQueries
{
  constructor(
    private readonly establishmentLeadRepository: InMemoryEstablishmentLeadRepository,
    private readonly conventionQueries: ConventionQueries,
  ) {}

  public async getLastConventionsByUniqLastEventKind(
    kind: EstablishmentLeadEventKind,
  ): Promise<ConventionReadDto[]> {
    const sirets =
      await this.establishmentLeadRepository.getSiretsByUniqLastEventKind(kind);
    return isSiretsListFilled(sirets)
      ? this.conventionQueries.getLatestConventionBySirets(sirets)
      : [];
  }
}
