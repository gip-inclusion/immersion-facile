import React from "react";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ImmersionApplicationForm } from "src/app/pages/ImmersionApplication/ImmersionApplicationForm";
import { ImmersionApplicationFormContainerLayout } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormContainerLayout";
import { immersionApplicationInitialValuesFromUrl } from "src/app/pages/ImmersionApplication/immersionApplicationHelpers";

import { routes } from "src/app/routing/routes";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { Route } from "type-route";

export type ImmersionApplicationPageRoute = Route<
  typeof routes.immersionApplication
>;

export interface ImmersionApplicationPageProps {
  route: ImmersionApplicationPageRoute;
}

export type ImmersionApplicationPresentation = Exclude<
  Partial<ImmersionApplicationDto>,
  "id" | "rejectionJustification" | "legacySchedule"
> & {
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
};

export const ImmersionApplicationPage = ({
  route,
}: ImmersionApplicationPageProps) => (
  <HeaderFooterLayout>
    <ImmersionApplicationFormContainerLayout>
      <ImmersionApplicationForm
        properties={immersionApplicationInitialValuesFromUrl(route)}
        routeParams={route.params}
      />
    </ImmersionApplicationFormContainerLayout>
  </HeaderFooterLayout>
);
