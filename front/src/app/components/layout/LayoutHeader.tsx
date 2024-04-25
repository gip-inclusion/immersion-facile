import { fr } from "@codegouvfr/react-dsfr";
import {
  Display,
  headerFooterDisplayItem,
} from "@codegouvfr/react-dsfr/Display";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import React from "react";
import { MaintenanceCallout } from "react-design-system";
import { useDispatch } from "react-redux";
import { domElementIds } from "shared";
import { commonContent } from "src/app/contents/commonContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes, useRoute } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { makeStyles } from "tss-react/dsfr";

import immersionFacileDarkLogo from "/assets/img/logo-if-dark.svg";
import immersionFacileLightLogo from "/assets/img/logo-if.svg";

export const LayoutHeader = () => {
  const dispatch = useDispatch();
  const { enableMaintenance } = useFeatureFlags();

  const currentRoute = useRoute();
  const darkModeState = useIsDark();
  const { classes } = makeStyles({ name: LayoutHeader.displayName })(() => ({
    operator: {
      boxSizing: "content-box",
      width: window.matchMedia(fr.breakpoints.up("md").replace("@media ", ""))
        .matches
        ? "10.5rem"
        : "100%",
      maxWidth: "10.5rem !important",
    },
  }))();
  const immersionFacileLogo = darkModeState.isDark
    ? immersionFacileDarkLogo
    : immersionFacileLightLogo;
  const {
    candidate: candidateIds,
    establishment: establishmentIds,
    agency: agencyIds,
    admin: adminIds,
  } = domElementIds.header.navLinks;

  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);
  const isPeConnected = useAppSelector(authSelectors.isPeConnected);
  const tools: HeaderProps["quickAccessItems"] = [headerFooterDisplayItem];

  if (isPeConnected || isInclusionConnected) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: isPeConnected ? "Se déconnecter (PE Connect)" : "Se déconnecter",
      buttonProps: {
        onClick: () => {
          dispatch(authSlice.actions.federatedIdentityDeletionTriggered());
          if (isPeConnected && currentRoute.name === "conventionImmersion") {
            const {
              fedId: _1,
              fedIdProvider: _2,
              ...rest
            } = currentRoute.params;
            routes.conventionImmersion(rest).replace();
          }
        },
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
  const links: MainNavigationProps.Item[] = [
    {
      text: "Accueil",
      linkProps: {
        ...routes.home().link,
        id: domElementIds.header.navLinks.home,
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
            id: candidateIds.home,
          },
        },
        {
          text: "Trouver une entreprise accueillante",
          isActive: currentRoute.name === routes.search().name,
          linkProps: {
            ...routes.search().link,
            id: candidateIds.search,
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: candidateIds.formConvention,
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
            id: establishmentIds.home,
          },
        },
        {
          text: "Référencer mon entreprise",
          isActive: currentRoute.name === routes.formEstablishment().name,
          linkProps: {
            ...routes.formEstablishment().link,
            id: establishmentIds.addEstablishmentForm,
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: establishmentIds.formConvention,
          },
        },
        {
          text: "Piloter mon entreprise",
          isActive:
            currentRoute.name ===
            routes.establishmentDashboard({ tab: "conventions" }).name,
          linkProps: {
            ...routes.establishmentDashboard({ tab: "conventions" }).link,
            id: establishmentIds.dashboard,
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
            id: agencyIds.home,
          },
        },
        {
          text: "Référencer mon organisme",
          isActive: currentRoute.name === routes.addAgency().name,
          linkProps: {
            ...routes.addAgency().link,
            id: agencyIds.addAgencyForm,
          },
        },
        {
          text: "Remplir la demande de convention",
          isActive: false,
          linkProps: {
            ...routes.conventionImmersion().link,
            id: agencyIds.formConvention,
          },
        },
        {
          text: "Piloter mon organisme",
          isActive: false,
          linkProps: {
            ...routes.agencyDashboard().link,
            id: agencyIds.dashboard,
          },
        },
      ],
    },
  ];

  if (isAdminConnected) {
    links.push({
      text: "Admin",
      isActive: currentRoute.name === routes.admin({ tab: "conventions" }).name,
      //id: getHeaderNavLinkId("admin-subnav-toggle"),
      menuLinks: [
        {
          text: "Backoffice",
          isActive: false,
          linkProps: {
            ...routes.admin({ tab: "conventions" }).link,
            id: adminIds.backOffice,
          },
        },
        {
          text: "Notifications",
          isActive: false,
          linkProps: {
            ...routes.admin({ tab: "notifications" }).link,
            id: adminIds.emails,
          },
        },
      ],
    });
  }

  return (
    <>
      {enableMaintenance.isActive && (
        <MaintenanceCallout
          message={
            enableMaintenance.value.message !== ""
              ? enableMaintenance.value.message
              : commonContent.maintenanceMessage
          }
        />
      )}
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
          alt: "Immersion Facilitée - Faciliter la réalisation des immersions professionnelles",
        }}
        navigation={links}
        quickAccessItems={tools}
      />
      <Display />
    </>
  );
};

LayoutHeader.displayName = "LayoutHeader";
