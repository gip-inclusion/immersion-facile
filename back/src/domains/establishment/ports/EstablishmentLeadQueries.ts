import { ConventionReadDto } from "shared";
import { EstablishmentLeadReminderParams } from "../useCases/SendEstablishmentLeadReminderScript";

export interface EstablishmentLeadQueries {
  getLastConventionsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<ConventionReadDto[]>;
}
