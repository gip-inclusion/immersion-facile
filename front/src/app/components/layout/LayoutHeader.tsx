import React from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import {
  Display,
  headerFooterDisplayItem,
} from "@codegouvfr/react-dsfr/Display";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { makeStyles } from "tss-react/dsfr";
import { domElementIds } from "shared";
import { MaintenanceCallout } from "react-design-system";
import { commonContent } from "src/app/contents/commonContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes, useRoute } from "src/app/routes/routes";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";

import immersionFacileLightLogo from "/assets/img/logo-if.svg";
import immersionFacileDarkLogo from "/assets/img/logo-if-dark.svg";

export const LayoutHeader = () => {
  const dispatch = useDispatch();
  const { enableMaintenance } = useFeatureFlags();
  const maintenanceMessage = useAppSelector(
    featureFlagSelectors.maintenanceMessage,
  );
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

  const isAdminConnected = useAppSelector(adminSelectors.auth.isAuthenticated);
  const isPeConnected = useAppSelector(authSelectors.isPeConnected);
  const tools: HeaderProps["quickAccessItems"] = [headerFooterDisplayItem];
  if (isAdminConnected) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: "Se déconnecter",
      buttonProps: {
        onClick: () => dispatch(adminAuthSlice.actions.logoutRequested()),
      },
    });
  }
  if (isPeConnected) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: "Se déconnecter (PE Connect)",
      buttonProps: {
        onClick: () =>
          dispatch(
            authSlice.actions.federatedIdentityDeletionTriggered("other"),
          ),
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
            id: adminIds.dashboard,
          },
        },
      ],
    },
  ];
  if (isAdminConnected) {
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
            id: adminIds.backOffice,
          },
        },
        {
          text: "Notifications",
          isActive: false,
          linkProps: {
            ...routes.adminTab({ tab: "notifications" }).link,
            id: adminIds.emails,
          },
        },
        //In the end - Should be placed at the establishment menu
        {
          text: "🛠 DEMO - Piloter mon entreprise 🛠",
          isActive: false,
          linkProps: {
            ...routes.establishmentDashboard().link,
            "aria-disabled": true,
            id: establishmentIds.establishmentDashboard,
          },
        },
        //-------------------------------------------------------
      ],
    });
  }

  return (
    <>
      {enableMaintenance.isActive && (
        <MaintenanceCallout
          message={
            maintenanceMessage || maintenanceMessage !== ""
              ? maintenanceMessage
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
