import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Route } from "type-route";

import { FormEstablishmentSource } from "shared";

import { MainWrapper } from "react-design-system";

import { EstablishmentCreationForm } from "src/app/components/forms/establishment/EstablishmentCreationForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";

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

  if (consumerConfig.isIframe)
    return <EstablishmentCreationForm source={consumer} />;

  return (
    <HeaderFooterLayout>
      <EstablishmentCreationForm source={consumer} />
    </HeaderFooterLayout>
  );
};
