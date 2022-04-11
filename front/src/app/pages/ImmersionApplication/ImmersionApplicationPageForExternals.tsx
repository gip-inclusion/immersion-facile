import React from "react";
import { ImmersionApplicationForm } from "src/app/pages/ImmersionApplication/ImmersionApplicationForm";
import { ImmersionApplicationFormContainerLayout } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormContainerLayout";
import { ImmersionApplicationFormUkraine } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormUkraine";
import { immersionApplicationInitialValuesFromUrl } from "src/app/pages/ImmersionApplication/immersionApplicationHelpers";
import { routes } from "src/app/routing/routes";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { Route } from "type-route";

type ImmersionApplicationSource =
  | "immersion-facile"
  | "lesentreprises-sengagent-ukraine";

const externalConsumers: Partial<
  Record<ImmersionApplicationSource, { isIframe: boolean }>
> = {
  "lesentreprises-sengagent-ukraine": { isIframe: true },
};

export type ImmersionApplicationPageForExternalRoute = Route<
  typeof routes.immersionApplicationForExternals
>;

interface ImmersionApplicationPageForExternalProps {
  route: ImmersionApplicationPageForExternalRoute;
}

export const ImmersionApplicationPageForExternals = ({
  route,
}: ImmersionApplicationPageForExternalProps) => {
  const { params } = route;

  const consumer = params.consumer as ImmersionApplicationSource;
  const consumerConfig = externalConsumers[consumer];

  if (!consumerConfig)
    return (
      <HeaderFooterLayout>
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
      </HeaderFooterLayout>
    );

  if (
    consumerConfig.isIframe &&
    consumer === "lesentreprises-sengagent-ukraine"
  )
    return (
      <ImmersionApplicationFormContainerLayout>
        <ImmersionApplicationFormUkraine
          properties={immersionApplicationInitialValuesFromUrl(route)}
        />
      </ImmersionApplicationFormContainerLayout>
    );

  return (
    <HeaderFooterLayout>
      <ImmersionApplicationFormContainerLayout>
        <ImmersionApplicationForm
          properties={immersionApplicationInitialValuesFromUrl(route)}
        />
      </ImmersionApplicationFormContainerLayout>
    </HeaderFooterLayout>
  );
};
