import React from "react";
import { useDispatch } from "react-redux";
import { routes, useRoute } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import {
  LinkHome,
  Header,
  MarianneLogo,
  ImmersionLogo,
  ToolType,
  NavLink,
} from "react-design-system/immersionFacile";
import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const isAdminConnected = useAppSelector(adminSelectors.isAuthenticated);
  const tools: ToolType[] = [];
  if (isAdminConnected) {
    tools.push({
      iconClassName: "fr-link fr-fi-lock-line",
      label: "Se déconnecter",
      callback: () => dispatch(adminSlice.actions.logoutRequested()),
    });
  }

  const links: (NavLink & { display: boolean })[] = [
    {
      label: "Home",
      link: routes.home().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.home().name,
    },
    {
      label: "Demande immersion",
      link: routes.convention().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.convention().name,
    },
    {
      label: "Formulaire Entreprise",
      link: routes.formEstablishment().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.formEstablishment().name,
    },
    {
      label: "Landing entreprise",
      link: routes.landingEstablishment().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.landingEstablishment().name,
    },
    {
      label: "Recherche",
      link: routes.search().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.search().name,
    },
    {
      label: "Ajouter agence",
      link: routes.addAgency().link,
      display: isAdminConnected,
      active: currentRoute.name === routes.addAgency().name,
    },
    {
      label: "Backoffice",
      link: routes.adminTab({ tab: "conventions" }).link,
      display: isAdminConnected && featureFlags.enableAdminUi,
      active:
        currentRoute.name === routes.adminTab({ tab: "conventions" }).name,
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
