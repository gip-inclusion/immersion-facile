import React from "react";
import { useDispatch } from "react-redux";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import {
  LinkHome,
  HeaderV2,
  MarianneLogo,
  ImmersionLogo,
  ActionsType,
  LinksType,
} from "react-design-system/immersionFacile";
import { ENV } from "src/environmentVariables";
import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

const { frontEnvType } = ENV;

export const ImmersionMarianneHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const isAdminConnected = useAppSelector(adminSelectors.isAuthenticated);
  const actions: ActionsType = [];
  if (isAdminConnected) {
    actions.push({
      iconClassName: "fr-fi-lock-line",
      label: "Se déconnecter",
      callback: () => dispatch(adminSlice.actions.logoutRequested()),
    });
  }
  const isDev = frontEnvType === "DEV";
  const links: LinksType = [
    {
      label: "Home",
      link: routes.home().link,
      display: isDev,
    },
    {
      label: "Demande immersion",
      link: routes.convention().link,
      display: isDev,
    },
    {
      label: "Backoffice",
      link: routes.admin().link,
      display: isDev && featureFlags.enableAdminUi,
    },
    {
      label: "Formulaire Entreprise",
      link: routes.formEstablishment().link,
      display: isDev,
    },
    {
      label: "Landing entreprise",
      link: routes.landingEstablishment().link,
      display: isDev,
    },
    {
      label: "Recherche",
      link: routes.search().link,
      display: isDev,
    },
    {
      label: "Ajouter agence",
      link: routes.addAgency().link,
      display: isDev,
    },
  ];
  const linksFiltered = links.filter((link) => link.display);
  return (
    <HeaderV2
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
      actions={actions}
      links={linksFiltered}
    />
  );
};
