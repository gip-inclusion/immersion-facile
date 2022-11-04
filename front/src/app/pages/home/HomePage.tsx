import React from "react";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  FixedStamp,
  HeroHeader,
  HeroHeaderNavCard,
  MainWrapper,
  SectionFaq,
  SectionStats,
  SectionTextEmbed,
  Stat,
} from "react-design-system/immersionFacile";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { routes } from "src/app/routing/routes";
import heroHeaderIllustration from "/src/assets/img/illustration-hero.webp";
import logoLeMoisLesEntreprises from "../../../assets/img/logo-le-mois-les-entreprises.svg";

const DebugInfo = () => (
  <div
    style={{
      position: "fixed",
      top: "1rem",
      right: "1rem",
      backgroundColor: "rgba(255,255,255,.8)",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,.1)",
      zIndex: 1000,
      padding: "1rem",
      fontSize: ".75rem",
      maxWidth: 300,
    }}
  >
    <span
      style={{
        fontWeight: "bold",
        fontSize: "1rem",
      }}
    >
      Env variables are:
    </span>

    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName}>
        {envName}: <strong>{JSON.stringify(envValue, null, 2)}</strong>
      </div>
    ))}
  </div>
);
const heroHeaderNavCards = {
  default: [
    {
      overtitle: "Candidat",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "candidate",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Entreprise",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "establishment",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "agency",
      url: "/accueil-beneficiaires",
    },
  ],
  candidate: [
    {
      overtitle: "Candidat",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "candidate",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Entreprise",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "establishment",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "agency",
      url: "/accueil-beneficiaires",
    },
  ],
  establishment: [
    {
      overtitle: "Candidat",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "candidate",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Entreprise",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "establishment",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "agency",
      url: "/accueil-beneficiaires",
    },
  ],
  agency: [
    {
      overtitle: "Candidat",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "candidate",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Entreprise",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "establishment",
      url: "/accueil-beneficiaires",
    },
    {
      overtitle: "Prescripteur",
      title: "Vous êtes candidat pour une immersion",
      icon: "fr-icon-user-line",
      type: "agency",
      url: "/accueil-beneficiaires",
    },
  ],
};
const sectionStatsData: Stat[] = [
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

const sectionFaqData = [
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

type UserType = "default" | "candidate" | "establishment" | "agency";

type HomePageProps = {
  type: UserType;
};

export const HomePage = ({ type }: HomePageProps) => {
  const featureFlags = useFeatureFlags();
  return (
    <div>
      <ImmersionMarianneHeader />
      <MainWrapper layout="fullscreen" vSpacing={0} useBackground>
        <HeroHeader
          title="La meilleure façon de faire émerger de nouveaux talents"
          description="Avec Immersion Facilitée, trouvez un métier à tester, entrez en relation immédiatement avec une entreprise accueillante, remplissez une demande de convention et obtenez une réponse en temps record !"
          illustration={heroHeaderIllustration}
          type="default"
          patterns
          navCards={heroHeaderNavCards[type] as HeroHeaderNavCard[]}
          parallax
        />
        <SectionStats stats={sectionStatsData} />
        <SectionTextEmbed videoUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/" />
        <SectionFaq articles={sectionFaqData} />
      </MainWrapper>

      <ImmersionFooter />

      {featureFlags.enableTemporaryOperation && (
        <FixedStamp
          image={
            <img
              src={logoLeMoisLesEntreprises}
              alt="Le mois - Les entreprises s'engagent"
            />
          }
          overtitle="Devenez"
          title="entreprise accueillante"
          subtitle="Ouvrez vos portes aux talents de demain"
          link={routes.landingEstablishment().link}
        />
      )}
    </div>
  );
};
