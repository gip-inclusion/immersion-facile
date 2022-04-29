import React from "react";
import { agencyGateway } from "src/app/config/dependencies";
import { getAgencyIdBehavior$ } from "src/app/pages/ImmersionApplication/ImmersionApplication.presenter";
import { ImmersionApplicationFormContainerLayout } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormContainerLayout";
import { ImmersionApplicationFormUkraine } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormUkraine";
import { immersionApplicationInitialValuesFromUrl } from "src/app/pages/ImmersionApplication/immersionApplicationHelpers";
import { ImmersionFacileAgencyNotActive } from "src/app/pages/ImmersionApplication/ImmersionFacileAgencyNotActive";
import { routes } from "src/app/routing/routes";
import { AgencyId } from "shared/src/agency/agency.dto";
import { useObservable } from "src/useObservable";
import { Route } from "type-route";

export type ImmersionApplicationUkrainePageRoute = Route<
  typeof routes.immersionApplicationForUkraine
>;

interface ImmersionApplicationPageForUkraineProps {
  route: ImmersionApplicationUkrainePageRoute;
}

export const ImmersionApplicationPageForUkraine = ({
  route,
}: ImmersionApplicationPageForUkraineProps) => {
  const agencyId = useObservable<AgencyId | false>(
    getAgencyIdBehavior$(agencyGateway),
    false,
  );

  return (
    <ImmersionApplicationFormContainerLayout>
      {agencyId ? (
        <ImmersionApplicationFormUkraine
          properties={{
            ...immersionApplicationInitialValuesFromUrl(route),
            agencyId,
          }}
        />
      ) : (
        <ImmersionFacileAgencyNotActive />
      )}
    </ImmersionApplicationFormContainerLayout>
  );
};
