import { EstablishmentCreationForm } from "src/app/FormEstablishment/EstablishmentCreationForm";
import { Route } from "type-route";
import { routes } from "../routes";
import { Layout } from "../../components/Layout";
import React from "react";
import { FormEstablishmentSource } from "src/shared/formEstablishment/FormEstablishment.dto";

type EstablishmentFormForExternalsProps = {
  route: Route<typeof routes.formEstablishmentForExternals>;
};

const externalConsumers: Partial<
  Record<FormEstablishmentSource, { isIframe: boolean }>
> = {
  cci: { isIframe: false },
  cma: { isIframe: false },
  "lesentreprises-sengagent": { isIframe: true },
};

export const EstablishmentFormForExternals = ({
  route,
}: EstablishmentFormForExternalsProps) => {
  const { params } = route;

  const consumer = params.consumer as FormEstablishmentSource;
  const consumerConfig = externalConsumers[consumer];

  if (!consumerConfig)
    return (
      <Layout>
        <div
          role="alert"
          className="fr-alert fr-alert--info w-5/6 m-auto mt-10"
        >
          <p className="fr-alert__title">
            La source '{consumer}' n'est pas référencée. Êtes vous certain
            d’avoir la bonne url ?
          </p>
          <p>Veuillez contacter immersion facile pour être référencé.</p>
        </div>
      </Layout>
    );

  if (consumerConfig.isIframe)
    return <EstablishmentCreationForm source={consumer} />;

  return (
    <Layout>
      <EstablishmentCreationForm source={consumer} />
    </Layout>
  );
};
