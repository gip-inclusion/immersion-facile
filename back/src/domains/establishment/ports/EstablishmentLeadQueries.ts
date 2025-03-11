import type { ConventionDto } from "shared";
import type { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";

export type GetLastConventionsByUniqLastEventKindParams =
  EstablishmentLeadReminderParams & { maxResults: number };

export interface EstablishmentLeadQueries {
  getLastConventionsByUniqLastEventKind(
    params: GetLastConventionsByUniqLastEventKindParams,
  ): Promise<ConventionDto[]>;
}
