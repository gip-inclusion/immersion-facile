import { fr } from "@codegouvfr/react-dsfr";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import React from "react";
import { ButtonWithSubMenu, MaintenanceCallout } from "react-design-system";
import { useDispatch } from "react-redux";
import { AbsoluteUrl, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes, useRoute } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { makeStyles } from "tss-react/dsfr";

import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
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
  const { admin: adminIds, quickAccess: quickAccessIds } =
    domElementIds.header.navLinks;

  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);
  const isPeConnected = useAppSelector(authSelectors.isPeConnected);
  const { enableProConnect } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );
  const getLinkToUpdateAccountInfo = (): AbsoluteUrl => {
    if (ENV.envType === "production") {
      if (enableProConnect.isActive)
        return "https://app.moncomptepro.beta.gouv.fr/personal-information";
      return "https://connect.inclusion.beta.gouv.fr/accounts/my-account";
    }
    if (enableProConnect.isActive)
      return "https://app-preprod.moncomptepro.beta.gouv.fr/personal-information";
    return "https://recette.connect.inclusion.beta.gouv.fr/accounts/my-account";
  };

  const tools: HeaderProps["quickAccessItems"] = [
    {
      text: "Remplir la demande de convention",
      iconId: "fr-icon-draft-line",
      linkProps: {
        ...routes.initiateConvention().link,
        id: quickAccessIds.initiateConvention,
      },
    },
    <ButtonWithSubMenu
      navItems={[
        {
          text: "Je suis un candidat",
          isActive: false,
          linkProps: {
            ...routes.beneficiaryDashboard().link,
            id: quickAccessIds.beneficiary,
          },
        },
        {
          text: "Je suis une entreprise",
          isActive: false,
          linkProps: {
            ...routes.establishmentDashboard().link,
            id: quickAccessIds.establishment,
          },
        },
        {
          text: "Je suis un prescripteur",
          isActive: false,
          linkProps: {
            ...routes.agencyDashboard().link,
            id: quickAccessIds.agency,
          },
        },
        ...(isInclusionConnected
          ? [
              {
                text: "Modifier mes informations",
                isActive: false,
                linkProps: {
                  href: getLinkToUpdateAccountInfo(),
                  target: "_blank",
                },
              },
            ]
          : []),
      ]}
      id={quickAccessIds.myAccount}
      buttonLabel={"Mon espace"}
    />,
  ];

  if (isPeConnected || isInclusionConnected) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: isPeConnected ? "Se déconnecter (PE Connect)" : "Se déconnecter",
      buttonProps: {
        onClick: () => {
          dispatch(
            authSlice.actions.federatedIdentityDeletionTriggered({
              mode: "device-and-inclusion",
            }),
          );
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

  const links: MainNavigationProps.Item[] = [];

  if (isAdminConnected) {
    links.push({
      text: "Admin",
      isActive: currentRoute.name === routes.adminConventions().name,
      menuLinks: [
        {
          text: "Backoffice",
          isActive: false,
          linkProps: {
            ...routes.adminConventions().link,
            id: adminIds.backOffice,
          },
        },
        {
          text: "Notifications",
          isActive: false,
          linkProps: {
            ...routes.adminNotifications().link,
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
              : "⚠️ Le site est actuellement en maintenance. Il est possible que le service soit dégradé. Nous vous prions de nous excuser pour la gêne occasionnée."
          }
          level={enableMaintenance.value.severity}
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
    </>
  );
};

LayoutHeader.displayName = "LayoutHeader";
