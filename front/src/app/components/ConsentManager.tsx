import { createConsentManagement } from "@codegouvfr/react-dsfr/consentManagement";

export const {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
  useConsent,
} = createConsentManagement({
  finalityDescription: () => ({
    statistics: {
      title: "Mesure d'audience",
      description:
        "Nous utilisons des cookies pour mesurer l’audience de notre site et améliorer son contenu.",
    },
    support: {
      title: "Support et assistance utilisateur",
      description:
        "Nous utilisons des cookies pour vous proposer la fonctionnalité de contact par chat avec le support d'Immersion Facilitée.",
    },
  }),
  personalDataPolicyLinkProps: {
    href: "/politique-de-confidentialite",
  },
  consentCallback: (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
  },
});

export const getConsentModal = () => {
  const modalElement = document.querySelector("#fr-consent-modal");
  return {
    modalElement,
    modalElementDSFR: modalElement
      ? (window as any).dsfr(modalElement).modal
      : null,
  };
};
