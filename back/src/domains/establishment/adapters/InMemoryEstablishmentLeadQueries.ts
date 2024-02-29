import { ConventionReadDto } from "shared";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { isSiretsListFilled } from "../entities/EstablishmentLeadEntity";
import { EstablishmentLeadQueries } from "../ports/EstablishmentLeadQueries";
import { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";
import { InMemoryEstablishmentLeadRepository } from "./InMemoryEstablishmentLeadRepository";

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
