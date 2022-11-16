import { Dispatch } from "@reduxjs/toolkit";
import {
  HeroHeaderNavCard,
  Stat,
  FaqCardProps,
} from "react-design-system/immersionFacile";
import { routes } from "src/app/routing/routes";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import type { UserType } from "../HomePage";
import heroHeaderDefaultIllustration from "/src/assets/img/illustration-default-hero.webp";
import heroHeaderCandidateIllustration from "/src/assets/img/illustration-candidate-hero.webp";
import heroHeaderEstablishmentIllustration from "/src/assets/img/illustration-establishment-hero.webp";
import heroHeaderAgencyIllustration from "/src/assets/img/illustration-agency-hero.webp";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";

type HeroHeaderInfos = {
  displayName: string;
  title: string;
  subtitle: string;
  icon: string;
  illustration: string;
};

export const heroHeaderContent: Record<UserType, HeroHeaderInfos> = {
  default: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "default",
    illustration: heroHeaderDefaultIllustration,
    icon: "",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
  candidate: {
    title: "La meilleure façon de découvrir votre futur métier",
    displayName: "Candidat",
    illustration: heroHeaderCandidateIllustration,
    icon: "fr-icon-user-line",
    subtitle:
      "Assurez le succès de votre projet professionnel en découvrant un métier en conditions réelles. Passez quelques jours en entreprise pour vérifier que ce métier vous plaît et vous convient. Profitez-en pour découvrir éventuellement votre futur employeur !",
  },
  establishment: {
    title: "Rencontrer des candidats motivés ? C’est possible !",
    displayName: "Entreprise",
    illustration: heroHeaderEstablishmentIllustration,
    icon: "fr-icon-building-line",
    subtitle:
      "Contribuez au succès de reconversions professionnelles en ouvrant vos entreprises. Permettez à des profils motivés de découvrir le métier de leur choix, en conditions réelles auprès des professionnels en activité et identifiez ceux qui pourraient venir renforcer votre équipe.",
  },
  agency: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "Prescripteur",
    illustration: heroHeaderAgencyIllustration,
    icon: "fr-icon-map-pin-user-line",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
};

export const heroHeaderNavCards: (
  storeDispatch: Dispatch,
  siretModalDispatch: Dispatch,
  peConnectModalDispatch: Dispatch,
) => Record<UserType, HeroHeaderNavCard[]> = (
  storeDispatch: Dispatch,
  siretModalDispatch: Dispatch,
  peConnectModalDispatch: Dispatch,
) => ({
  default: [
    {
      overtitle: "Candidat",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "candidate",
      link: routes.homeCandidates().link,
    },
    {
      overtitle: "Entreprise",
      title: "Vous représentez une entreprise",
      icon: "fr-icon-building-line",
      type: "establishment",
      link: routes.homeEstablishments().link,
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes prescripteur",
      icon: "fr-icon-map-pin-user-line",
      type: "agency",
      link: routes.homeAgencies().link,
    },
  ],
  candidate: [
    {
      title: "Rechercher une entreprise accueillante",
      icon: "fr-icon-search-line",
      type: "candidate",
      link: routes.search().link,
    },
    {
      title: "Remplir la demande de convention",
      icon: "fr-icon-file-line",
      type: "candidate",
      link: {
        href: "",
        onClick: (event) => {
          event.preventDefault();
          peConnectModalDispatch({
            type: "CLICKED_OPEN",
          });
        },
      },
    },
    // {
    //   title: "Conseils utiles pour l’immersion",
    //   icon: "fr-icon-info-line",
    //   type: "candidate",
    //   link: "@TODO",
    // },
  ],
  establishment: [
    {
      title: "Référencer mon entreprise",
      icon: "fr-icon-hotel-line",
      type: "establishment",
      link: {
        href: "",
        onClick: (event) => {
          event.preventDefault();
          siretModalDispatch({
            type: "CLICKED_OPEN",
            payload: {
              mode: "register",
            },
          });
          storeDispatch(establishmentSlice.actions.gotReady());
        },
      },
    },
    {
      title: "Modifier mes informations",
      icon: "fr-icon-edit-line",
      type: "establishment",
      link: {
        href: "",
        onClick: (event) => {
          event.preventDefault();
          siretModalDispatch({
            type: "CLICKED_OPEN",
            payload: {
              mode: "edit",
            },
          });
          storeDispatch(establishmentSlice.actions.gotReady());
        },
      },
    },
    {
      title: "Remplir la demande de convention",
      icon: "fr-icon-file-text-line",
      type: "establishment",
      link: {
        href: "",
        onClick: (event) => {
          event.preventDefault();
          storeDispatch(
            authSlice.actions.federatedIdentityProvided("noIdentityProvider"),
          );
          routes.conventionImmersion().push();
        },
      },
    },
  ],
  agency: [
    {
      title: "Référencer mon organisme",
      icon: "fr-icon-hotel-line",
      type: "agency",
      link: routes.addAgency().link,
    },
    {
      title: "Remplir la demande de convention",
      icon: "fr-icon-file-text-line",
      type: "agency",
      link: {
        href: "",
        onClick: (event) => {
          event.preventDefault();
          storeDispatch(
            authSlice.actions.federatedIdentityProvided("noIdentityProvider"),
          );
          routes.conventionImmersion().push();
        },
      },
    },
  ],
});
export const sectionStatsData: Stat[] = [
  {
    badgeLabel: "Découverte",
    value: "1",
    subtitle: "jour, 1 semaine ou 1 mois en entreprise",
    description:
      "L’immersion professionnelle est une période courte, variable, adaptée à vos besoins et non rémunérée pour découvrir le métier de votre choix.",
  },
  {
    badgeLabel: "Simplicité",
    value: "100%",
    subtitle: "démarche dématérialisée",
  },
  {
    badgeLabel: "Opportunité",
    value: "7",
    subtitle: "demandeurs d’emploi sur 10",
    description: "trouvent un emploi dans les mois qui suivent leur immersion.",
  },
];

export const sectionFaqData: FaqCardProps[] = [
  {
    title: "Comment trouver une entreprise accueillante ?",
    description: `A partir de la page candidat du service Immersion Facilitée, cliquez sur le bouton "Trouver une entreprise accueillante" ou rendez-vous directement sur la page...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-trouver-une-entreprise-accueillante-ek1x8s/",
  },
  {
    title: "A quoi sert une immersion professionelle ?",
    description: `Elle vous permet d’assurer le succès de votre projet professionnel en découvrant un métier en conditions réelles, de passer quelques jours en entreprise pour vérifier...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/a-quoi-sert-une-immersion-professionnelle-1yd6ije/",
  },
  {
    title: "Comment contacter une entreprise pour demander une immersion ?",
    description: `SI une entreprise a le label "entreprise accueillante", pour lui demander une une immersion, vous devez cliquer sur "contacter l'entreprise" et compléter le formulaire...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-contacter-une-entreprise-pour-demander-une-immersion-8dqotx/",
  },
];
