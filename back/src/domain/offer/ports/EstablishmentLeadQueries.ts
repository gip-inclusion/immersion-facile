import { ConventionReadDto } from "shared";
import { EstablishmentLeadEventKind } from "../entities/EstablishmentLeadEntity";

export interface EstablishmentLeadQueries {
  getLastConventionsByUniqLastEventKind(
    kind: EstablishmentLeadEventKind,
  ): Promise<ConventionReadDto[]>;
}
