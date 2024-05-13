import { ConventionDto } from "shared";
import { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";

export interface EstablishmentLeadQueries {
  getLastConventionsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<ConventionDto[]>;
}
