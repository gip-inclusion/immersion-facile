import { createTargets, CreateTargets, Target } from "http-client";
import { WithAuthorization } from "../admin/admin.dto";

const getAgencyDashboardUrl = "/inclusion-connected/agency-dashboard";

export type InclusionConnectedAllowedTargets = CreateTargets<{
  getAgencyDashboard: Target<
    void,
    void,
    WithAuthorization,
    typeof getAgencyDashboardUrl
  >;
}>;

export const inclusionConnectedAllowedTargets =
  createTargets<InclusionConnectedAllowedTargets>({
    getAgencyDashboard: {
      method: "GET",
      url: getAgencyDashboardUrl,
    },
  });
