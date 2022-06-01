import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export const getAgencyIdBehavior$ = (agencyGateway: AgencyGateway) =>
  agencyGateway.getImmersionFacileAgencyId();
