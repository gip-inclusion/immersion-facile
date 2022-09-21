import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";
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

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const isAdminConnected = useAppSelector(adminSelectors.auth.isAuthenticated);
  const tools: Tool[] = [];
  if (isAdminConnected) {
    tools.push({
      iconClassName: "fr-link fr-fi-lock-line",
      label: "Se déconnecter",
      callback: () => dispatch(adminAuthSlice.actions.logoutRequested()),
    });
  }

  const links: (NavLink & { display: boolean })[] = [
    {
      label: "Home",
      display: isAdminConnected,
      active: currentRoute.name === routes.home().name,
      ...routes.home().link,
    },
    {
      label: "Demande immersion",
      display: isAdminConnected,
      active: currentRoute.name === routes.convention().name,
      ...routes.convention().link,
    },
    {
      label: "Formulaire Entreprise",
      display: isAdminConnected,
      active: currentRoute.name === routes.formEstablishment().name,
      ...routes.formEstablishment().link,
    },
    {
      label: "Landing entreprise",
      display: isAdminConnected,
      active: currentRoute.name === routes.landingEstablishment().name,
      ...routes.landingEstablishment().link,
    },
    {
      label: "Recherche",
      display: isAdminConnected,
      active: currentRoute.name === routes.search().name,
      ...routes.search().link,
    },
    {
      label: "Ajouter agence",
      display: isAdminConnected,
      active: currentRoute.name === routes.addAgency().name,
      ...routes.addAgency().link,
    },
    {
      label: "Backoffice",
      display: isAdminConnected && featureFlags.enableAdminUi,
      active:
        currentRoute.name === routes.adminTab({ tab: "conventions" }).name,
      ...routes.adminTab({ tab: "conventions" }).link,
    },
    {
      label: "Emails",
      display: isAdminConnected && featureFlags.enableAdminUi,
      active: false,
      ...routes.adminTab({ tab: "emails" }).link,
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
