import React, { useLayoutEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { createConsentManagement } from "@codegouvfr/react-dsfr/consentManagement";
import { CrispChat } from "react-design-system";
import { useFetchFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { MatomoTagManager } from "src/app/MatomoTagManager";
import { ErrorPage } from "src/app/pages/error/ErrorPage";
import { useRoute } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { Router } from "./routes/Router";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(rootAppSlice.actions.appIsReady());
  }, [dispatch]);
};

export const {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
  useConsent,
} = createConsentManagement({
  finalityDescription: () => ({
    advertising: {
      title: "Publicité",
      description:
        "Nous utilisons des cookies pour vous proposer des publicités adaptées à vos centres d’intérêts et mesurer leur efficacité.",
    },
    analytics: {
      title: "Analyse",
      description:
        "Nous utilisons des cookies pour mesurer l’audience de notre site et améliorer son contenu.",
    },
    personalization: {
      title: "Personnalisation",
      description:
        "Nous utilisons des cookies pour vous proposer des contenus adaptés à vos centres d’intérêts.",
    },
    instagram: {
      title: "Instagram integration",
      description: "We use cookies to display Instagram content.",
    },
    statistics: {
      title: "Statistiques",
      description:
        "Nous utilisons des cookies pour mesurer l’audience de notre site et améliorer son contenu.",
      subFinalities: {
        deviceInfo: "Informations sur votre appareil",
        traffic: "Informations sur votre navigation",
      },
    },
  }),
  personalDataPolicyLinkProps: {
    href: "/politique-de-confidentialite",
  },
  consentCallback: async () => {},
});
export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();
  const currentRoute = useRoute();
  const dispatch = useDispatch();
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <ErrorPage message={error.message} />}
      resetKeys={[currentRoute]}
      onReset={() => {
        dispatch(rootAppSlice.actions.appResetRequested());
      }}
    >
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
      <ConsentBannerAndConsentManagement />
      <MatomoTagManager containerUrl="https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7.js" />
    </ErrorBoundary>
  );
};
