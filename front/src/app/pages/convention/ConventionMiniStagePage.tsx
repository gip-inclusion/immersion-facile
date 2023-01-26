import React from "react";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

interface ConventionMiniStagePageProps {
  route: ConventionMiniStagePageRoute;
}

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => (
  <ConventionFormContainerLayout
    title={useConventionTexts("mini-stage-cci").intro.conventionTitle}
  >
    <ConventionForm
      properties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "mini-stage-cci",
      })}
      routeParams={route.params}
    />
  </ConventionFormContainerLayout>
);
