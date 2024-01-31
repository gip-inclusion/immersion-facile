import { createConsentManagement } from "@codegouvfr/react-dsfr/consentManagement";

export const {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
  useConsent,
} = createConsentManagement({
  finalityDescription: () => ({
    statistics: {
      title: "Statistiques",
      description:
        "Nous utilisons des cookies pour mesurer l’audience de notre site et améliorer son contenu.",
    },
    support: {
      title: "Support",
      description:
        "Nous utilisons des cookies pour vous proposer la fonctionnalité de contact par chat avec le support d'Immersion Facilitée.",
    },
    metabase: {
      title: "Affichage de données",
      description:
        "Nous utilisons des cookies pour afficher des données sous forme de tableau de bord Metabase (état de convention, statistiques, tableau de bord prescripteur, tableau de bord entreprise).",
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
