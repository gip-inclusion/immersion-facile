import immersionFacileLogo from "/img/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";
import React from "react";
import {
  Header,
  ImmersionLogo,
  LinkHome,
  MarianneLogo,
  NavLink,
  Tool,
} from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { routes, useRoute } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";

type HeaderNavLinks = (NavLink & {
  display: boolean;
  children?: (NavLink & { display: boolean })[];
})[];

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const isAdminConnected = useAppSelector(adminSelectors.auth.isAuthenticated);
  const tools: Tool[] = [];
  if (isAdminConnected) {
    tools.push({
      iconClassName: "fr-btn fr-icon-lock-line",
      label: "Se déconnecter",
      callback: () => dispatch(adminAuthSlice.actions.logoutRequested()),
    });
  }
  const isCandidateRoute =
    currentRoute.name === routes.search().name ||
    currentRoute.name === routes.homeCandidates().name;
  const isEstablishmentRoute =
    currentRoute.name === routes.formEstablishment().name ||
    currentRoute.name === routes.homeEstablishments().name;
  const isAgencyRoute =
    currentRoute.name === routes.addAgency().name ||
    currentRoute.name === routes.homeAgencies().name;
  const links: HeaderNavLinks = [
    {
      label: "Accueil",
      display: true,
      active: currentRoute.name === routes.home().name,
      ...routes.home().link,
    },
    {
      label: "Candidat",
      display: true,
      active: isCandidateRoute,
      children: [
        {
          label: "Accueil candidat",
          display: true,
          active: currentRoute.name === routes.homeCandidates().name,
          ...routes.homeCandidates().link,
        },
        {
          label: "Trouver une entreprise accueillante",
          display: true,
          active: currentRoute.name === routes.search().name,
          ...routes.search().link,
        },
        {
          label: "Remplir la demande de convention",
          display: true,
          active: false,
          ...routes.conventionImmersion().link,
        },
      ],
    },
    {
      label: "Entreprise",
      display: true,
      active: isEstablishmentRoute,
      children: [
        {
          label: "Accueil entreprise",
          display: true,
          active: currentRoute.name === routes.homeEstablishments().name,
          ...routes.homeEstablishments().link,
        },
        {
          label: "Référencer mon entreprise",
          display: true,
          active: currentRoute.name === routes.formEstablishment().name,
          ...routes.formEstablishment().link,
        },
        {
          label: "Remplir la demande de convention",
          display: true,
          active: false,
          ...routes.conventionImmersion().link,
        },
      ],
    },
    {
      label: "Prescripteurs",
      display: true,
      active: isAgencyRoute,
      children: [
        {
          label: "Accueil prescripteurs",
          display: true,
          active: currentRoute.name === routes.homeAgencies().name,
          ...routes.homeAgencies().link,
        },
        {
          label: "Référencer mon organisme",
          display: true,
          active: currentRoute.name === routes.addAgency().name,
          ...routes.addAgency().link,
        },
        {
          label: "Remplir la demande de convention",
          display: true,
          active: false,
          ...routes.conventionImmersion().link,
        },
      ],
    },
    {
      label: "Admin",
      display: isAdminConnected && featureFlags.enableAdminUi,
      active:
        currentRoute.name === routes.adminTab({ tab: "conventions" }).name,
      children: [
        {
          label: "Backoffice",
          display: true,
          active: false,
          ...routes.adminTab({ tab: "conventions" }).link,
        },
        {
          label: "Landing entreprise",
          display: true,
          active: false,
          ...routes.landingEstablishment().link,
        },
      ],
    },
  ];

  const linksFiltered = links.filter((link) => link.display);
  return (
    <Header
      marianneLogo={
        <LinkHome {...routes.home().link}>
          <MarianneLogo />
        </LinkHome>
      }
      immersionLogo={
        <LinkHome {...routes.home().link} className="w-full h-full shadow-none">
          <ImmersionLogo url={immersionFacileLogo} />
        </LinkHome>
      }
      tools={tools}
      navLinks={linksFiltered}
    />
  );
};
