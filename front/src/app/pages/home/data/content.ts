import {
  HeroHeaderNavCard,
  Stat,
  FaqCardProps,
} from "react-design-system/immersionFacile";
import { routes } from "src/app/routing/routes";
import type { UserType } from "../HomePage";

export const heroHeaderNavCards: Record<UserType, HeroHeaderNavCard[]> = {
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
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "establishment",
      link: routes.homeEstablishments().link,
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
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
    {
      title: "Conseils utiles pour l’immersion",
      icon: "fr-icon-info-line",
      type: "candidate",
      link: "@TODO",
    },
  ],
  establishment: [
    {
      title: "Référencer mon entreprise",
      icon: "fr-icon-hotel-line",
      type: "establishment",
      link: routes.formEstablishment().link,
    },
    {
      title: "Modifier mes informations",
      icon: "fr-icon-edit-line",
      type: "establishment",
      link: "",
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
      link: "/ajouter-prescripteur",
    },
    {
      title: "Modifier mes informations",
      icon: "fr-icon-edit-line",
      type: "agency",
      link: "",
    },
    {
      title: "Remplir la demande de convention",
      icon: "fr-icon-file-text-line",
      type: "agency",
      link: routes.conventionImmersion().link,
    },
  ],
};
export const sectionStatsData: Stat[] = [
  {
    badgeLabel: "Découverte",
    value: "1",
    subtitle: "mois maximum",
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
    title: "Comment contacter une entreprise pour demander une immersion ?",
    description: `Si une entreprise a le label "entreprise accueillante", pour lui demander une une immersion, vous devez cliquer sur "contacter l'entreprise" et compléter le formulaire qui s'affiche puis cliquer sur "envoyer".`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-contacter-une-entreprise-pour-demander-une-immersion-8dqotx/",
  },
  {
    title: "Comment contacter une entreprise pour demander une immersion ?",
    description: `Si une entreprise a le label "entreprise accueillante", pour lui demander une une immersion, vous devez cliquer sur "contacter l'entreprise" et compléter le formulaire qui s'affiche puis cliquer sur "envoyer".`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-contacter-une-entreprise-pour-demander-une-immersion-8dqotx/",
  },
  {
    title: "Comment contacter une entreprise pour demander une immersion ?",
    description: `Si une entreprise a le label "entreprise accueillante", pour lui demander une une immersion, vous devez cliquer sur "contacter l'entreprise" et compléter le formulaire qui s'affiche puis cliquer sur "envoyer".`,
    url: "https://aide.immersion-facile.beta.gouv.fr/fr/article/comment-contacter-une-entreprise-pour-demander-une-immersion-8dqotx/",
  },
];
