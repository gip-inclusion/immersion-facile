import React from "react";
import { MainWrapper } from "react-design-system";
import { ConventionFormWrapper } from "src/app/components/forms/convention/ConventionFormWrapper";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { frontErrors } from "src/app/pages/error/front-errors";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ErrorPage } from "../error/ErrorPage";

export type ConventionImmersionForExternalsRoute = Route<
  typeof routes.conventionImmersionForExternals
>;

type ConventionPageForExternalsProperties = {
  route: ConventionImmersionForExternalsRoute;
};

export const ConventionPageForExternals = ({
  route,
}: ConventionPageForExternalsProperties): JSX.Element => {
  const externalConsumer =
    externalConsumers[route.params.consumer as ConventionFormSource];

  if (!externalConsumer) {
    return (
      <ErrorPage
        error={frontErrors.convention.externalConsumerNotFound({
          consumerName: route.params.consumer,
        })}
      />
    );
  }

  return externalConsumer.isIframe ? (
    <ConventionFormWrapper internshipKind="immersion" mode="create" />
  ) : (
    <HeaderFooterLayout>
      <MainWrapper layout="default">
        <ConventionFormWrapper internshipKind="immersion" mode="create" />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

export type ConventionFormSource = keyof typeof externalConsumers;
const externalConsumers = {
  diagoriente: { isIframe: true },
  "milo-paris": { isIframe: false },
} satisfies Record<string, { isIframe: boolean }>;
