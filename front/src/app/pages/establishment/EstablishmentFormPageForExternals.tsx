import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { MainWrapper } from "react-design-system";
import type { FormEstablishmentSource } from "shared";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

type EstablishmentFormForExternalsProps = {
  route: Route<typeof routes.formEstablishmentForExternals>;
};

const externalConsumers: Partial<
  Record<FormEstablishmentSource, { isIframe: boolean }>
> = {
  cci: { isIframe: false },
  cma: { isIframe: false },
  "lesentreprises-sengagent": { isIframe: true },
  unJeuneUneSolution: { isIframe: true },
};

export const EstablishmentFormPageForExternals = ({
  route,
}: EstablishmentFormForExternalsProps) => {
  const { params } = route;

  const consumer = params.consumer as FormEstablishmentSource;
  const consumerConfig = externalConsumers[consumer];

  if (!consumerConfig)
    return (
      <HeaderFooterLayout>
        <MainWrapper layout="boxed">
          <div role="alert" className={fr.cx("fr-alert", "fr-alert--info")}>
            <p className={fr.cx("fr-alert__title")}>
              La source '{consumer}' n'est pas référencée. Êtes vous certain
              d’avoir la bonne url ?
            </p>
            <p>Veuillez contacter immersion facile pour être référencé.</p>
          </div>
        </MainWrapper>
      </HeaderFooterLayout>
    );

  if (consumerConfig.isIframe) return <EstablishmentForm mode="create" />;

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <EstablishmentForm mode="create" />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
