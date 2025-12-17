import { Header, type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";

import {
  ButtonWithSubMenu,
  MaintenanceCallout,
  useLayout,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { domElementIds } from "shared";
import { ressourcesAndWebinarsUrl } from "src/app/contents/home/content";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import {
  type AgencyDashboardRouteName,
  agencyDashboardRoutes,
} from "src/app/pages/auth/ConnectedPrivateRoute";
import { routes, useRoute } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { makeStyles } from "tss-react/dsfr";
import immersionFacileLightLogo from "/assets/img/logo-if.svg";
import immersionFacileDarkLogo from "/assets/img/logo-if-dark.svg";

export const LayoutHeader = () => {
  const dispatch = useDispatch();
  const { enableMaintenance } = useFeatureFlags();

  const currentRoute = useRoute();
  const darkModeState = useIsDark();

  const immersionFacileLogo = darkModeState.isDark
    ? immersionFacileDarkLogo
    : immersionFacileLightLogo;
  const {
    candidate: candidateIds,
    establishment: establishmentIds,
    agency: agencyIds,
    admin: adminIds,
    quickAccess: quickAccessIds,
  } = domElementIds.header.navLinks;

  const isConnectedUser = useAppSelector(authSelectors.isConnectedUser);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);
  const isPeConnected = useAppSelector(authSelectors.isPeConnected);
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

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
      key={`${quickAccessIds.initiateConvention}-button-with-sub-menu`}
      buttonIconId="fr-icon-account-line"
      navItems={[
        {
          children: "Je suis un candidat",
          id: quickAccessIds.beneficiary,
          linkProps: routes.beneficiaryDashboard().link,
        },
        {
          children: "Je suis une entreprise",
          id: quickAccessIds.establishment,
          linkProps: routes.establishmentDashboard().link,
        },
        {
          children: "Je suis un prescripteur",
          id: quickAccessIds.agency,
          linkProps: routes.agencyDashboardMain().link,
        },
        ...(isConnectedUser
          ? [
              {
                children: "Mon profil",
                id: quickAccessIds.myAccount,
                linkProps: routes.myProfile().link,
              },
            ]
          : []),
      ]}
      buttonLabel={
        currentUser
          ? currentUser.firstName && currentUser.lastName
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : currentUser.email
          : "Mon espace"
      }
    />,
  ];

  if (isPeConnected || isConnectedUser) {
    tools.push({
      iconId: "fr-icon-lock-line",
      text: isPeConnected ? "Se déconnecter (FT Connect)" : "Se déconnecter",
      buttonProps: {
        onClick: () => {
          dispatch(
            authSlice.actions.fetchLoggoutUrlRequested({
              mode:
                federatedIdentity?.provider === "email"
                  ? "device-only"
                  : "device-and-oauth",
            }),
          );
          if (isPeConnected && currentRoute.name === "conventionImmersion") {
            const {
              fedId: _1,
              fedIdProvider: _2,
              fedIdToken: _3,
              ...rest
            } = currentRoute.params;
            routes.conventionImmersion(rest).replace();
            return;
          }
          routes.home().push();
        },
      },
    });
  }

  const isCandidateRoute =
    currentRoute.name === routes.search().name ||
    currentRoute.name === routes.homeCandidates().name ||
    currentRoute.name === routes.beneficiaryDashboard().name;
  const isEstablishmentRoute =
    currentRoute.name === routes.formEstablishment().name ||
    currentRoute.name === routes.homeEstablishments().name ||
    currentRoute.name === routes.establishmentDashboard().name;
  const isAgencyRoute =
    currentRoute.name === routes.addAgency().name ||
    currentRoute.name === routes.homeAgencies().name ||
    agencyDashboardRoutes.includes(
      currentRoute.name as AgencyDashboardRouteName,
    );
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
            ...routes.initiateConvention({
              skipFirstStep: true,
            }).link,
            id: candidateIds.formConvention,
          },
        },
        {
          text: "Mon espace",
          isActive: currentRoute.name === routes.beneficiaryDashboard().name,
          linkProps: {
            ...routes.beneficiaryDashboard().link,
            id: candidateIds.dashboard,
          },
        },
      ],
    },
    {
      text: "Entreprises",
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
          text: "Proposer une immersion",
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
          text: "Mon espace",
          isActive:
            currentRoute.name ===
            routes.establishmentDashboardConventions().name,
          linkProps: {
            ...routes.establishmentDashboardConventions().link,
            id: establishmentIds.dashboard,
          },
        },
      ],
    },
    {
      text: "Prescripteurs",
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
          text: "Inscrire mon organisme",
          isActive: currentRoute.name === routes.addAgency().name,
          linkProps: {
            ...routes.agencyDashboardAgencies({ isAgencyRegistration: true })
              .link,
            id: agencyIds.agencyDashboardAgencies,
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
          text: "Mon espace",
          isActive: false,
          linkProps: {
            ...routes.agencyDashboardMain().link,
            id: agencyIds.dashboard,
          },
        },
        {
          text: "Ressources et webinaires",
          isActive: false,
          linkProps: {
            href: ressourcesAndWebinarsUrl,
            id: agencyIds.resourcesAndWebinars,
          },
        },
      ],
    },
  ];

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

  const { isLayoutDesktop } = useLayout();

  const { classes } = makeStyles({ name: LayoutHeader.displayName })(() => ({
    operator: {
      boxSizing: "content-box",
      width: isLayoutDesktop ? "10.5rem" : "100%",
      maxWidth: "10.5rem !important",
    },
  }))();

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
