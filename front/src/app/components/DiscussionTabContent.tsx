import type { ExchangeRole } from "shared";
import { DiscussionList } from "src/app/components/establishment/establishment-dashboard/DiscussionList";
import { DiscussionManageContent } from "src/app/components/establishment/establishment-dashboard/DiscussionManageContent";
import type {
  BeneficiaryDashboardRouteName,
  EstablishmentDashboardRouteName,
} from "src/app/pages/auth/ConnectedPrivateRoutePage";
import { makeUseTypedRoute } from "src/app/routes/routes.hooks";

const useDashboardDiscussionRoute = makeUseTypedRoute<
  EstablishmentDashboardRouteName | BeneficiaryDashboardRouteName
>();

export const DiscussionTabContent = ({ viewer }: { viewer: ExchangeRole }) => {
  const route = useDashboardDiscussionRoute([
    "establishmentDashboard",
    "establishmentDashboardDiscussions",
    "establishmentDashboardConventions",
    "establishmentDashboardFormEstablishment",
    "beneficiaryDashboard",
    "beneficiaryDashboardDiscussions",
  ]);
  return (route.name === "establishmentDashboardDiscussions" ||
    route.name === "beneficiaryDashboardDiscussions") &&
    route.params.discussionId ? (
    <DiscussionManageContent
      discussionId={route.params.discussionId}
      viewer={viewer}
    />
  ) : (
    <DiscussionList viewer={viewer} />
  );
};
