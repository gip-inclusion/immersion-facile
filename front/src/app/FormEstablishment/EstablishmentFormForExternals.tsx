import { Route } from "type-route";
import { routes } from "../routes";
import { Layout } from "../../components/Layout";
import { EstablishmentForm } from "./EstablishmentForm";
import React from "react";

type EstablishmentFormForExternalsProps = {
  route: Route<typeof routes.formEstablishmentForExternals>;
};

const externalConsumers: Partial<Record<string, { isIframe: boolean }>> = {
  cci: { isIframe: false },
  cma: { isIframe: false },
  "lesentreprises-sengagent": { isIframe: true },
};

export const EstablishmentFormForExternals = ({
  route,
}: EstablishmentFormForExternalsProps) => {
  const {
    params: { consumer },
  } = route;
  const consumerConfig = externalConsumers[consumer];

  if (!consumerConfig)
    return (
      <Layout>
        <div role="alert" className="fr-alert fr-alert--info">
          <p className="fr-alert__title">
            La source '{consumer}' n'est pas référencée, êtes vous certain que
            le chemin de l'url est correct ?
          </p>
        </div>
        <EstablishmentForm />
      </Layout>
    );

  if (consumerConfig.isIframe) return <EstablishmentForm />;

  return (
    <Layout>
      <EstablishmentForm />
    </Layout>
  );
};
