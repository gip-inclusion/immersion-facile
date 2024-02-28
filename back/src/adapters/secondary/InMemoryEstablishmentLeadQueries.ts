import { ConventionReadDto } from "shared";
import { ConventionQueries } from "../../domains/convention/ports/ConventionQueries";
import { isSiretsListFilled } from "../../domains/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../../domains/offer/ports/EstablishmentLeadQueries";
import { EstablishmentLeadReminderParams } from "../../domains/offer/useCases/SendEstablishmentLeadReminderScript";
import { InMemoryEstablishmentLeadRepository } from "./offer/InMemoryEstablishmentLeadRepository";

export class InMemoryEstablishmentLeadQueries
  implements EstablishmentLeadQueries
{
  constructor(
    private readonly establishmentLeadRepository: InMemoryEstablishmentLeadRepository,
    private readonly conventionQueries: ConventionQueries,
  ) {}

  public async getLastConventionsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
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
