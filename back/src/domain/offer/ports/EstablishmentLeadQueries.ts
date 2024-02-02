import { ConventionReadDto } from "shared";
import { EstablishmentLeadEventKind } from "../entities/EstablishmentLeadEntity";

export interface EstablishmentLeadQueries {
  getLastConventionsByLastEventKind(
    kind: EstablishmentLeadEventKind,
  ): Promise<ConventionReadDto[]>;
}
