import type { AgencyRight } from "../agency/agency.dto";
import type { ConventionId } from "../convention/convention.dto";

export const hasUserRightToGetLastBroadcastFeedback = (
  conventionId: ConventionId,
  userAgencyRights: AgencyRight[],
  userIsBackofficeAdmin: boolean,
) =>
  userAgencyRights.find(
    (agencyRight) => agencyRight.agency.id === conventionId,
  ) || userIsBackofficeAdmin;
