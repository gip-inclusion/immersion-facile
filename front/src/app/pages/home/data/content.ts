import { Dispatch } from "@reduxjs/toolkit";
import {
  HeroHeaderNavCard,
  Stat,
  FaqCardProps,
} from "react-design-system/immersionFacile";
import { routes } from "src/app/routing/routes";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import type { UserType } from "../HomePage";

type HeroHeaderInfos = {
  displayName: string;
  title: string;
  subtitle: string;
  icon: string;
};

export const heroHeaderContent: Record<UserType, HeroHeaderInfos> = {
  default: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "default",
    icon: "",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
  candidate: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "Candidat",
    icon: "fr-icon-user-line",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
  establishment: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "Entreprise",
    icon: "fr-icon-building-line",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
  agency: {
    title: "La meilleure façon de faire émerger de nouveaux talents",
    displayName: "Prescripteur",
    icon: "fr-icon-map-pin-user-line",
    subtitle:
      "Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !",
  },
};

export const heroHeaderNavCards: (
  storeDispatch: Dispatch,
  modalDispatch: Dispatch,
) => Record<UserType, HeroHeaderNavCard[]> = (
  storeDispatch: Dispatch,
  modalDispatch: Dispatch,
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
      link: routes.conventionImmersion().link,
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
          modalDispatch({
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
          modalDispatch({
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
      link: routes.conventionImmersion().link,
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
      title: "Modifier mes informations",
      icon: "fr-icon-edit-line",
      type: "agency",
      link: routes.addAgency().link,
    },
    {
      title: "Remplir la demande de convention",
      icon: "fr-icon-file-text-line",
      type: "agency",
      link: routes.conventionImmersion().link,
    },
  ],
});
export const sectionStatsData: Stat[] = [
  {
    badgeLabel: "Découverte",
    value: "1",
    subtitle: "jour, 1 semaine ou 1 mois en entreprise",
    description:
      "L’immersion professionnelle est une période courte et non rémunérée de découverte en entreprise.",
  },
  {
    badgeLabel: "Découverte",
    value: "100%",
    subtitle: "démarche dématérialisée",
  },
  {
    badgeLabel: "Découverte",
    value: "7",
    subtitle: "demandeurs d’emploi sur 10",
    description: "trouvent un emploi dans les mois qui suivent leur immersion.",
  },
];

export const sectionFaqData: FaqCardProps[] = [
  {
    title: "Comment trouver une entreprise accueillante ?",
    description: `Si une entreprise a le label "entreprise accueillante", pour lui demander une une immersion, vous devez cliquer sur "contacter l'entreprise" et compléter le formulaire...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-trouver-une-entreprise-accueillante-ek1x8s/",
  },
  {
    title: "Comment contacter une entreprise pour demander une immersion ?",
    description: `A partir de la page d'accueil du service Immersion Facilitée, cliquez sur le bouton "Trouver une entreprise accueillante" ou rendez-vous directement...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-contacter-une-entreprise-pour-demander-une-immersion-8dqotx/",
  },
  {
    title: `Que signifie le label "Tentez votre chance" dans les résultats de recherche ?`,
    description: `Cliquez sur "rechercher" pour lancer la recherche. Quelques secondes peuvent être nécessaires pour afficher les résultats de recherche...`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/que-signifie-le-label-tentez-votre-chance-dans-les-resultats-de-recherche-1c1zmkx/",
  },
];
