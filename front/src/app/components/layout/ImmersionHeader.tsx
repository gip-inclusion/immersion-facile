import immersionFacileLogo from "/img/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";
import { makeStyles } from "tss-react/dsfr";
import React from "react";
import { useDispatch } from "react-redux";
import { routes, useRoute } from "src/app/routes/routes";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import {
  Display,
  headerFooterDisplayItem,
} from "@codegouvfr/react-dsfr/Display";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
const getHeaderNavLinkId = (chunk: string) => `im-header-nav__${chunk}`;

export const ImmersionHeader = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  const currentRoute = useRoute();
  const { classes } = customStyles();
  const isAdminConnected = useAppSelector(adminSelectors.auth.isAuthenticated);
  const tools: HeaderProps["quickAccessItems"] = [];
  if (isAdminConnected) {
    tools.push(
      {
        iconId: "fr-icon-lock-line",
        text: "Se déconnecter",
        buttonProps: {
          onClick: () => dispatch(adminAuthSlice.actions.logoutRequested()),
        },
      },
      headerFooterDisplayItem,
    );
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
  const links: MainNavigationProps.Item[] = [
    {
      text: "Accueil",
      linkProps: {
        ...routes.home().link,
        id: getHeaderNavLinkId("home"),
      },
      isActive: currentRoute.name === routes.home().name,
    },
    {
      text: "Candidats",
      isActive: isCandidateRoute,
      //id: getHeaderNavLinkId("candidate-subnav-toggle"),
      menuLinks: [
        {
          text: "Accueil candidat",
          isActive: currentRoute.name === routes.homeCandidates().name,
          linkProps: {
            ...routes.homeCandidates().link,
            id: getHeaderNavLinkId("candidate-home"),
          },
        },
        {
          text: "Trouver une entreprise accueillante",
          isActive: currentRoute.name === routes.search().name,
          linkProps: {
            ...routes.search().link,
            id: getHeaderNavLinkId("candidate-search"),
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: getHeaderNavLinkId("candidate-form-convention"),
          },
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
          linkProps: {
            ...routes.homeEstablishments().link,
            id: getHeaderNavLinkId("establishment-home"),
          },
        },
        {
          text: "Référencer mon entreprise",
          isActive: currentRoute.name === routes.formEstablishment().name,

          linkProps: {
            ...routes.formEstablishment().link,
            id: getHeaderNavLinkId("establishment-form"),
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: getHeaderNavLinkId("establishment-form-convention"),
          },
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
          linkProps: {
            ...routes.homeAgencies().link,
            id: getHeaderNavLinkId("agency-home"),
          },
        },
        {
          text: "Référencer mon organisme",
          isActive: currentRoute.name === routes.addAgency().name,
          linkProps: {
            ...routes.addAgency().link,
            id: getHeaderNavLinkId("agency-form"),
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: getHeaderNavLinkId("agency-form-convention"),
          },
        },
        {
          text: "Recherche V2",
          isActive: false,
          linkProps: {
            ...routes.searchV2().link,
            id: getHeaderNavLinkId("admin-search-v2"),
          },
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
          linkProps: {
            ...routes.adminTab({ tab: "conventions" }).link,
            id: getHeaderNavLinkId("admin-home"),
          },
        },
        {
          text: "Emails",
          isActive: false,
          linkProps: {
            ...routes.adminTab({ tab: "emails" }).link,
            id: getHeaderNavLinkId("admin-emails"),
          },
        },
      ],
    });
  }

  return (
    <>
      <Header
        classes={classes}
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
          orientation: "horizontal",
          imgUrl: immersionFacileLogo,
          alt: "Immersion Facilitée",
        }}
        serviceTagline="Faciliter la réalisation des immersions professionelles"
        serviceTitle="Immersion Facilitée"
        navigation={links}
        quickAccessItems={tools}
      />
      <Display />
    </>
  );
};

ImmersionHeader.displayName = "ImmersionHeader";

const customStyles = makeStyles({ name: ImmersionHeader.displayName })(() => ({
  operator: {
    width: 95,
  },
}));
