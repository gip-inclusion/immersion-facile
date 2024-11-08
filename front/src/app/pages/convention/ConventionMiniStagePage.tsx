import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { ConventionFormWrapper } from "src/app/components/forms/convention/ConventionFormWrapper";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

export const ConventionMiniStagePage = () => {
  const t = useConventionTexts("mini-stage-cci");
  return (
    <MainWrapper
      layout={"default"}
      vSpacing={3}
      pageHeader={
        <PageHeader title={t.intro.conventionTitle}>
          {t.intro.conventionSummaryDescription}
        </PageHeader>
      }
    >
      <ConventionFormWrapper internshipKind="mini-stage-cci" mode="create" />
    </MainWrapper>
  );
};
