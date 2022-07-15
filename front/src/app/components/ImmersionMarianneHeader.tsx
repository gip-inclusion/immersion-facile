import React from "react";
import { useDispatch } from "react-redux";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import {
  LinkHome,
  Header,
  MarianneLogo,
  ImmersionLogo,
  ToolsType,
  NavLinksType,
} from "react-design-system/immersionFacile";
import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const isAdminConnected = useAppSelector(adminSelectors.isAuthenticated);
  const tools: ToolsType = [];
  if (isAdminConnected) {
    tools.push({
      iconClassName: "fr-link fr-fi-lock-line",
      label: "Se déconnecter",
      callback: () => dispatch(adminSlice.actions.logoutRequested()),
    });
  }
  const links: NavLinksType = [
    {
      label: "Home",
      link: routes.home().link,
      display: isAdminConnected,
    },
    {
      label: "Demande immersion",
      link: routes.convention().link,
      display: isAdminConnected,
    },
    {
      label: "Backoffice",
      link: routes.admin().link,
      display: isAdminConnected && featureFlags.enableAdminUi,
    },
    {
      label: "Formulaire Entreprise",
      link: routes.formEstablishment().link,
      display: isAdminConnected,
    },
    {
      label: "Landing entreprise",
      link: routes.landingEstablishment().link,
      display: isAdminConnected,
    },
    {
      label: "Recherche",
      link: routes.search().link,
      display: isAdminConnected,
    },
    {
      label: "Ajouter agence",
      link: routes.addAgency().link,
      display: isAdminConnected,
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
      links={linksFiltered}
    />
  );
};
