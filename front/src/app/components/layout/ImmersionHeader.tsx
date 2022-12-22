import immersionFacileLogo from "/img/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";
import React from "react";
import { useDispatch } from "react-redux";
import { routes, useRoute } from "src/app/routes/routes";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";

//const getHeaderNavLinkId = (chunk: string) => `im-header-nav__${chunk}`;

export const ImmersionHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const isAdminConnected = useAppSelector(adminSelectors.auth.isAuthenticated);
  const tools: HeaderProps["quickAccessItems"] = [];
  if (isAdminConnected) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: "Se déconnecter",
      buttonProps: {
        onClick: () => dispatch(adminAuthSlice.actions.logoutRequested()),
      },
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
  const links: HeaderProps["navItems"] = [
    {
      text: "Accueil",
      linkProps: { ...routes.home().link },
      isActive: currentRoute.name === routes.home().name,
      //id: getHeaderNavLinkId("home"),
    },
    {
      text: "Candidats",
      isActive: isCandidateRoute,
      //id: getHeaderNavLinkId("candidate-subnav-toggle"),
      menuLinks: [
        {
          text: "Accueil candidat",
          //id: getHeaderNavLinkId("candidate-home"),
          isActive: currentRoute.name === routes.homeCandidates().name,
          linkProps: { ...routes.homeCandidates().link },
        },
        {
          text: "Trouver une entreprise accueillante",
          //id: getHeaderNavLinkId("candidate-search"),
          isActive: currentRoute.name === routes.search().name,
          linkProps: { ...routes.search().link },
        },
        {
          text: "Remplir la demande de convention",
          //id: getHeaderNavLinkId("candidate-form-convention"),
          isActive: false,
          linkProps: { ...routes.conventionImmersion().link },
        },
      ],
    },
    {
      text: "Entreprises",
      //id: getHeaderNavLinkId("establishment-subnav-toggle"),
      isActive: isEstablishmentRoute,
      menuLinks: [
        {
          text: "Accueil entreprise",
          isActive: currentRoute.name === routes.homeEstablishments().name,
          //id: getHeaderNavLinkId("establishment-home"),
          linkProps: { ...routes.homeEstablishments().link },
        },
        {
          text: "Référencer mon entreprise",
          isActive: currentRoute.name === routes.formEstablishment().name,
          //id: getHeaderNavLinkId("establishment-form"),
          linkProps: { ...routes.formEstablishment().link },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          //id: getHeaderNavLinkId("establishment-form-convention"),
          linkProps: { ...routes.conventionImmersion().link },
        },
      ],
    },
    {
      text: "Prescripteurs",
      //id: getHeaderNavLinkId("agency-subnav-toggle"),
      isActive: isAgencyRoute,
      menuLinks: [
        {
          text: "Accueil prescripteurs",
          isActive: currentRoute.name === routes.homeAgencies().name,
          //id: getHeaderNavLinkId("agency-home"),
          linkProps: { ...routes.homeAgencies().link },
        },
        {
          text: "Référencer mon organisme",
          isActive: currentRoute.name === routes.addAgency().name,
          //id: getHeaderNavLinkId("agency-form"),
          linkProps: { ...routes.addAgency().link },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          //id: getHeaderNavLinkId("agency-form-convention"),
          linkProps: { ...routes.conventionImmersion().link },
        },
        {
          label: "Recherche V2",
          display: true,
          active: false,
          id: getHeaderNavLinkId("admin-search-v2"),
          ...routes.searchV2().link,
        },
      ],
    },
  ];

  if (isAdminConnected && featureFlags.enableAdminUi) {
    links.push({
      text: "Admin",
      isActive:
        currentRoute.name === routes.adminTab({ tab: "conventions" }).name,
      //id: getHeaderNavLinkId("admin-subnav-toggle"),
      menuLinks: [
        {
          text: "Backoffice",
          isActive: false,
          //id: getHeaderNavLinkId("admin-home"),
          linkProps: { ...routes.adminTab({ tab: "conventions" }).link },
        },
        {
          text: "Emails",
          isActive: false,
          //id: getHeaderNavLinkId("admin-emails"),
          linkProps: { ...routes.adminTab({ tab: "emails" }).link },
        },
      ],
    });
  }

  return (
    <Header
      brandTop={
        <>
          République
          <br />
          Française
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Immersion Facilitée - Accueil",
      }}
      operatorLogo={{
        orientation: "vertical",
        imgUrl: immersionFacileLogo,
        alt: "Immersion Facilitée",
      }}
      serviceTagline="Faciliter la réalisation des immersions professionelles"
      serviceTitle="Immersion Facilitée"
      navItems={links}
      quickAccessItems={tools}
    />
  );
};
