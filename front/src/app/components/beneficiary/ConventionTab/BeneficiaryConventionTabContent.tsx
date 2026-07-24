import type { frontRoutes } from "shared";
import { makeUseTypedRoute } from "src/app/routes/routes.hooks";
import { BeneficiaryConventionList } from "./BeneficiaryConventionList";
import { UnavailableBeneficiaryConventionManageContent } from "./UnavailableBeneficiaryConventionManageContent";

type BeneficiaryConventionDashboardRouteName =
  (typeof frontRoutes.beneficiaryDashboardConventions)["name"];

export const BeneficiaryConventionTabContent = () => {
  const route = makeUseTypedRoute<BeneficiaryConventionDashboardRouteName>()([
    "beneficiaryDashboardConventions",
  ]);
  const conventionId = route.params.conventionId;

  return !conventionId ? (
    <BeneficiaryConventionList />
  ) : (
    <UnavailableBeneficiaryConventionManageContent
      conventionId={conventionId}
    />
  );
};
