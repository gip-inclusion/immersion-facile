import { createTargets, CreateTargets, Target } from "http-client";
import { WithAuthorization } from "../admin/admin.dto";
import { RegisterAgencyToInclusionConnectUserParams } from "../agency/agency.dto";

const getAgencyDashboardUrl = "/inclusion-connected/agency-dashboard";
const registerAgencyUrl = "/inclusion-connected/register-agency";

export type InclusionConnectedAllowedTargets = CreateTargets<{
  getAgencyDashboard: Target<
    void,
    void,
    WithAuthorization,
    typeof getAgencyDashboardUrl
  >;
  registerAgencyToUser: Target<
    RegisterAgencyToInclusionConnectUserParams,
    void,
    WithAuthorization,
    typeof registerAgencyUrl
  >;
}>;

export const inclusionConnectedAllowedTargets =
  createTargets<InclusionConnectedAllowedTargets>({
    getAgencyDashboard: {
      method: "GET",
      url: getAgencyDashboardUrl,
    },
    registerAgencyToUser: {
      method: "POST",
      url: registerAgencyUrl,
    },
  });
