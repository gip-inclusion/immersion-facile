import Button from "@codegouvfr/react-dsfr/Button";
import { frontRoutes } from "shared";
import { FrontSpecificError } from "src/app/pages/error/front-errors";
import { makeUseTypedRoute } from "src/app/routes/routes.hooks";
import { BeneficiaryConventionList } from "./BeneficiaryConventionList";

type BeneficiaryConventionDashboardRouteName =
  (typeof frontRoutes.beneficiaryDashboardConventions)["name"];

export const BeneficiaryConventionTabContent = () => {
  const route = makeUseTypedRoute<BeneficiaryConventionDashboardRouteName>()([
    "beneficiaryDashboardConventions",
  ]);
  const conventionId = route.params.conventionId;

  if (conventionId)
    throw new FrontSpecificError({
      title: `Pilotage de la convention ${conventionId}`,
      description:
        "Le pilotage de convention n'est pas accéssible pour le moment.",
      buttons: [
        <Button
          priority="primary"
          key="key"
          linkProps={{
            ...frontRoutes.beneficiaryDashboardConventions().link,
          }}
        >
          Retour à la liste des conventions
        </Button>,
      ],
    });

  return <BeneficiaryConventionList />;
};
