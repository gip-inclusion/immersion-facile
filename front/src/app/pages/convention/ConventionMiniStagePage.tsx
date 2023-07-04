import React from "react";
import { Route } from "type-route";
import { MainWrapper, PageHeader } from "react-design-system";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { routes } from "src/app/routes/routes";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

interface ConventionMiniStagePageProps {
  route: ConventionMiniStagePageRoute;
}

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => {
  const t = useConventionTexts("mini-stage-cci");
  return (
    <MainWrapper
      layout={"default"}
      pageHeader={
        <PageHeader title={t.intro.conventionTitle} theme="candidate" />
      }
    >
      <ConventionForm
        internshipKind="mini-stage-cci"
        route={route}
        mode="create"
      />
    </MainWrapper>
  );
};
