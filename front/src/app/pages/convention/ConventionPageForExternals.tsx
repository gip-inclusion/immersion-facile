import React from "react";
import { Route } from "type-route";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
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
        title="Partenaire inconnu"
        message={`Immersion Facilitée ne connait pas le partenaire "${route.params.consumer}".`}
      />
    );
  }

  return externalConsumer.isIframe ? (
    <ConventionForm
      conventionProperties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "immersion",
      })}
      routeParams={route.params}
      mode="create"
    />
  ) : (
    <HeaderFooterLayout>
      <ConventionForm
        conventionProperties={conventionInitialValuesFromUrl({
          route,
          internshipKind: "immersion",
        })}
        routeParams={route.params}
        mode="create"
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
