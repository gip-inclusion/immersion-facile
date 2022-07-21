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
  Tool,
  NavLink,
} from "react-design-system/immersionFacile";
import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const isAdminConnected = useAppSelector(adminSelectors.isAuthenticated);
  const tools: Tool[] = [];
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
      href: routes.home().link.href,
      display: isAdminConnected,
      active: currentRoute.name === routes.home().name,
    },
    {
      label: "Demande immersion",
      href: routes.convention().link.href,
      onClick: routes.convention().link.onClick,
      display: isAdminConnected,
      active: currentRoute.name === routes.convention().name,
    },
    {
      label: "Formulaire Entreprise",
      href: routes.formEstablishment().link.href,
      onClick: routes.formEstablishment().link.onClick,
      display: isAdminConnected,
      active: currentRoute.name === routes.formEstablishment().name,
    },
    {
      label: "Landing entreprise",
      href: routes.landingEstablishment().link.href,
      onClick: routes.landingEstablishment().link.onClick,
      display: isAdminConnected,
      active: currentRoute.name === routes.landingEstablishment().name,
    },
    {
      label: "Recherche",
      href: routes.search().link.href,
      onClick: routes.search().link.onClick,
      display: isAdminConnected,
      active: currentRoute.name === routes.search().name,
    },
    {
      label: "Ajouter agence",
      href: routes.addAgency().link.href,
      onClick: routes.addAgency().link.onClick,
      display: isAdminConnected,
      active: currentRoute.name === routes.addAgency().name,
    },
    {
      label: "Backoffice",
      href: routes.adminTab({ tab: "conventions" }).link.href,
      onClick: routes.adminTab({ tab: "conventions" }).link.onClick,
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
