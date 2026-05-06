import type { ExchangeRole } from "shared";
import { DiscussionList } from "src/app/components/establishment/establishment-dashboard/DiscussionList";
import { DiscussionManageContent } from "src/app/components/establishment/establishment-dashboard/DiscussionManageContent";
import type {
  FrontBeneficiaryDashboardRoute,
  FrontEstablishmentDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoutePage";
import { useRoute } from "src/app/routes/routes";

export const DiscussionTabContent = ({ viewer }: { viewer: ExchangeRole }) => {
  const route = useRoute() as
    | FrontEstablishmentDashboardRoute
    | FrontBeneficiaryDashboardRoute;
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
