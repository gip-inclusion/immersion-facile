import { AgencyGateway } from "src/domain/ports/AgencyGateway";

export const getAgencyIdBehavior$ = (agencyGateway: AgencyGateway) =>
  agencyGateway.getImmersionFacileAgencyId();
