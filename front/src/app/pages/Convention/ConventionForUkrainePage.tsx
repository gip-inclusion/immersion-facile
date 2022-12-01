import React from "react";
import { AgencyId } from "shared";
import { agencyGateway } from "src/config/dependencies";
import { getAgencyIdBehavior$ } from "src/app/components/forms/convention/Convention.presenter";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { ConventionFormUkraine } from "src/app/components/forms/convention/ConventionFormUkraine";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { ImmersionFacileAgencyNotActive } from "src/app/components/forms/convention/ImmersionFacileAgencyNotActive";
import { routes } from "src/app/routes/routes";
import { useObservable } from "src/app/hooks/useObservable";
import { Route } from "type-route";

export type ConventionUkrainePageRoute = Route<
  typeof routes.conventionForUkraine
>;

interface ConventionPageForUkraineProps {
  route: ConventionUkrainePageRoute;
}

export const ConventionPageForUkraine = ({
  route,
}: ConventionPageForUkraineProps) => {
  const agencyId = useObservable<AgencyId | false>(
    getAgencyIdBehavior$(agencyGateway),
    false,
  );

  return (
    <ConventionFormContainerLayout>
      {agencyId ? (
        <ConventionFormUkraine
          properties={{
            ...conventionInitialValuesFromUrl({
              route,
              internshipKind: "immersion",
            }),
            agencyId,
          }}
        />
      ) : (
        <ImmersionFacileAgencyNotActive />
      )}
    </ConventionFormContainerLayout>
  );
};
