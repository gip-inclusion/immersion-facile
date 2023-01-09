import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ErrorPage } from "../error/ErrorPage";
import React from "react";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

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
        title="Partenaire inconnu"
        message={`Immersion Facilitée ne connait pas le partenaire "${route.params.consumer}".`}
      />
    );
  }

  return externalConsumer.isIframe ? (
    <ConventionForm
      properties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "immersion",
      })}
      routeParams={route.params}
    />
  ) : (
    <HeaderFooterLayout>
      <ConventionForm
        properties={conventionInitialValuesFromUrl({
          route,
          internshipKind: "immersion",
        })}
        routeParams={route.params}
      />
    </HeaderFooterLayout>
  );
};

type ConventionFormSource = "diagoriente";

const externalConsumers: Partial<
  Record<ConventionFormSource, { isIframe: boolean }>
> = {
  diagoriente: { isIframe: true },
};
