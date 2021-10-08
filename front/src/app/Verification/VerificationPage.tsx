import React from "react";
import { routes } from "src/app/routes";
import { useImmersionApplicationFromJwt } from "src/app/sharedHooks/useImmersionApplicationFromJwt";
import { AdminVerificationButton } from "src/app/Verification/AdminVerificationButton";
import { AdvisorButton } from "src/app/Verification/AdvisorButton";
import { RejectApplicationButton } from "src/app/Verification/RejectApplicationButton";
import { ValidatorButton } from "src/app/Verification/ValidatorButton";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { Route } from "type-route";

type VerificationPageProps = {
  route: Route<typeof routes.verification>;
};

export const VerificationPage = ({ route }: VerificationPageProps) => {
  const { immersionApplication, roles } = useImmersionApplicationFromJwt(
    route.params.jwt,
  );

  const isValidator = roles.includes("validator");
  const isAdvisor = roles.includes("advisor");
  const isAdmin = roles.includes("admin");

  if (!isAdvisor && !isValidator && !isAdmin)
    return <div>Vous n'êtes pas autorisé à accéder à cette page"</div>;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {immersionApplication ? (
        <FormAccordion immersionApplication={immersionApplication} />
      ) : (
        "Chargement en cours..."
      )}
      <div>
        <RejectApplicationButton immersionApplication={immersionApplication} />

        {isValidator ? (
          // if advisor is also validator we only show this button
          <ValidatorButton immersionApplication={immersionApplication} />
        ) : (
          // in case advisor is not validator :
          <AdvisorButton immersionApplication={immersionApplication} />
        )}
        {isAdmin && (
          <AdminVerificationButton
            immersionApplication={immersionApplication}
          />
        )}
      </div>
    </div>
  );
};
