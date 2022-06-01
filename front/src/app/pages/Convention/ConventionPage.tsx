import React from "react";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ConventionForm } from "src/app/pages/Convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/pages/Convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/pages/Convention/conventionHelpers";

import { routes } from "src/app/routing/routes";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { Route } from "type-route";

export type ConventionPageRoute = Route<typeof routes.convention>;

interface ConventionPageProps {
  route: ConventionPageRoute;
}

export type ConventionPresentation = Exclude<
  Partial<ConventionDto>,
  "id" | "rejectionJustification" | "legacySchedule"
> & {
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
};

export const ConventionPage = ({ route }: ConventionPageProps) => (
  <HeaderFooterLayout>
    <ConventionFormContainerLayout>
      <ConventionForm
        properties={conventionInitialValuesFromUrl(route)}
        routeParams={route.params}
      />
    </ConventionFormContainerLayout>
  </HeaderFooterLayout>
);
