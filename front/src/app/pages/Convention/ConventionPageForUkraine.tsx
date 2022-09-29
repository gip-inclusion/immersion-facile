import React from "react";
import { AgencyId } from "shared";
import { agencyGateway } from "src/app/config/dependencies";
import { getAgencyIdBehavior$ } from "src/app/pages/Convention/Convention.presenter";
import { ConventionFormContainerLayout } from "src/app/pages/Convention/ConventionFormContainerLayout";
import { ConventionFormUkraine } from "src/app/pages/Convention/ConventionFormUkraine";
import { conventionInitialValuesFromUrl } from "src/app/pages/Convention/conventionHelpers";
import { ImmersionFacileAgencyNotActive } from "src/app/pages/Convention/ImmersionFacileAgencyNotActive";
import { routes } from "src/app/routing/routes";
import { useObservable } from "src/useObservable";
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
