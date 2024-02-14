import { ConventionReadDto } from "shared";
import { ConventionQueries } from "../../domain/convention/ports/ConventionQueries";
import {
  EstablishmentLeadEventKind,
  isSiretsListFilled,
} from "../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../../domain/offer/ports/EstablishmentLeadQueries";
import { EstablishmentLeadReminderParams } from "../../domain/offer/useCases/SendEstablishmentLeadReminderScript";
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
