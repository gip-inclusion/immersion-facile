import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Tile from "@codegouvfr/react-dsfr/Tile";

import { type ReactElement, type ReactNode, useEffect } from "react";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AllowedStartOAuthLoginPage,
  absoluteUrlSchema,
  domElementIds,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontAdminRouteTab } from "src/app/pages/admin/AdminTabs";
import { routes } from "src/app/routes/routes";
import {
  commonIllustrations,
  loginIllustration,
} from "src/assets/img/illustrations";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { Route } from "type-route";

export type FrontAdminRoute =
  | FrontAdminRouteTab
  | Route<typeof routes.adminUserDetail>
  | Route<typeof routes.adminConventionDetail>
  | Route<typeof routes.adminAgencyDetail>;

export const agencyDashboardTabsList = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
] satisfies AgencyDashboardRouteName[];

export type AgencyTabRoute = (typeof agencyDashboardTabsList)[number];

export const agencyDashboardRoutes = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
  "agencyDashboardAgencyDetails",
  "agencyDashboardOnboarding",
] satisfies AgencyDashboardRouteName[];

export type AgencyDashboardRouteName = FrontAgencyDashboardRoute["name"];

export type FrontAgencyDashboardRoute =
  | Route<typeof routes.agencyDashboardMain>
  | Route<typeof routes.agencyDashboardOnboarding>
  | Route<typeof routes.agencyDashboardSynchronisedConventions>
  | Route<typeof routes.agencyDashboardAgencies>
  | Route<typeof routes.agencyDashboardAgencyDetails>;

type InclusionConnectPrivateRoute =
  | FrontAdminRoute
  | FrontAgencyDashboardRoute
  | Route<typeof routes.formEstablishment>
  | Route<typeof routes.establishmentDashboard>
  | Route<typeof routes.myProfile>;

type InclusionConnectedPrivateRouteProps = {
  route: InclusionConnectPrivateRoute;
  children: ReactElement;
  inclusionConnectConnexionPageHeader: ReactElement;
  allowAdminOnly?: boolean;
};

export const ConnectedPrivateRoute = ({
  route,
  children,
  allowAdminOnly,
}: InclusionConnectedPrivateRouteProps) => {
  const dispatch = useDispatch();
  const isInclusionConnected = useAppSelector(
    authSelectors.isInclusionConnected,
  );
  const authIsLoading = useAppSelector(authSelectors.isLoading);
  const isLoadingUser = useAppSelector(inclusionConnectedSelectors.isLoading);
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);

  const afterLoginRedirectionUrl = useAppSelector(
    authSelectors.afterLoginRedirectionUrl,
  );

  useEffect(() => {
    const {
      token,
      email = "",
      firstName = "",
      lastName = "",
      idToken = "",
      siret = "",
    } = route.params;

    if (token) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          federatedIdentityWithUser: {
            provider: "connectedUser",
            token,
            email,
            lastName,
            firstName,
            idToken,
            siret,
          },
          feedbackTopic: "auth-global",
        }),
      );

      const { token: _, ...routeParams } = route.params;
      routes[route.name](routeParams as any).replace();
    }
  }, [route.params, dispatch, afterLoginRedirectionUrl]);

  useEffect(() => {
    if (!authIsLoading && !isInclusionConnected) {
      const windowUrl = absoluteUrlSchema.parse(window.location.href);
      dispatch(
        authSlice.actions.saveRedirectionAfterLoginRequested({
          url: windowUrl,
        }),
      );
    }
    if (!authIsLoading && isInclusionConnected && afterLoginRedirectionUrl)
      dispatch(authSlice.actions.redirectAndClearUrlAfterLoginRequested());
  }, [authIsLoading, isInclusionConnected, afterLoginRedirectionUrl, dispatch]);

  const page = getPage(route);
  const pageContent = pageContentByRoute[page] ?? pageContentByRoute.default;
  if (!isInclusionConnected) {
    return (
      <HeaderFooterLayout>
        <MainWrapper
          layout="default"
          pageHeader={
            <PageHeader
              title={pageContent.title}
              illustration={pageContent.illustration}
            >
              <>
                {pageContent.description}
                <div className={fr.cx("fr-my-2w")}>
                  <ProConnectButton
                    id={domElementIds[page].login.connectButton}
                    url={`/api${inclusionConnectImmersionRoutes.startInclusionConnectLogin.url}?${queryParamsAsString(
                      inclusionConnectImmersionRoutes.startInclusionConnectLogin.queryParamsSchema.parse(
                        { page },
                      ),
                    )}`}
                  />
                </div>
              </>
            </PageHeader>
          }
          vSpacing={6}
        >
          <section>
            <h2 className={fr.cx("fr-h3")}>{pageContent.cardsTitle}</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
              {pageContent.cards?.map((card) => (
                <div
                  className={fr.cx("fr-col-12", "fr-col-lg-4")}
                  key={card.description?.toString()}
                >
                  <Tile
                    title={card.title}
                    desc={card.description}
                    imageUrl={card.illustration}
                    imageAlt=""
                    imageSvg={false}
                  />
                </div>
              ))}
            </div>
          </section>
        </MainWrapper>
      </HeaderFooterLayout>
    );
  }

  if (isLoadingUser) return <Loader />;

  if (allowAdminOnly && !isAdminConnected)
    return (
      <HeaderFooterLayout>
        <MainWrapper layout="default">
          <Alert
            severity="error"
            title={"Accès refusé"}
            description={
              "Vous n'avez pas les droits nécessaires pour accéder à cette page."
            }
          />
        </MainWrapper>
      </HeaderFooterLayout>
    );
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">{children}</MainWrapper>
    </HeaderFooterLayout>
  );
};

const getPage = (
  route: InclusionConnectPrivateRoute,
): AllowedStartOAuthLoginPage => {
  if (route.name === "establishmentDashboard") return "establishmentDashboard";
  if (route.name === "agencyDashboardMain") return "agencyDashboard";
  if (route.name === "formEstablishment") return "establishment";
  return "admin";
};

type PageContent = {
  title: string;
  description: ReactNode;
  illustration: string;
  cardsTitle?: string;
  cards?: {
    title: string;
    description: ReactNode;
    link?: string;
    illustration: string;
  }[];
};

const pageContentByRoute: Record<
  AllowedStartOAuthLoginPage | "default",
  PageContent
> = {
  establishment: {
    title: "Proposer une immersion",
    description: (
      <p>
        <strong>Un compte unique</strong> pour publier et mettre à jour vos
        offres d’immersion. Vous pourrez aussi suivre et gérez toutes les
        candidatures reçues en un seul endroit.
      </p>
    ),
    cardsTitle: "Tous les avantages du compte entreprise",
    illustration: loginIllustration,
    cards: [
      {
        title: "Vos démarches centralisées",
        description:
          "Plus besoin de chercher dans vos emails ! Retrouvez toutes vos candidatures et conventions au même endroit.",
        illustration: commonIllustrations.warning,
      },
      {
        title: "Un accès simplifié",
        description:
          "Utilisez un seul identifiant pour vous connecter à l’ensemble des services de la Plateforme de l’Inclusion.",
        illustration: commonIllustrations.inscription,
      },
      {
        title: "Gérez vos offres",
        description: (
          <>
            <strong>Devenez administrateur</strong> de votre établissement et
            gérez directement vos offres d’immersions.
          </>
        ),
        illustration: commonIllustrations.monCompte,
      },
    ],
  },
  establishmentDashboard: {
    title: "Mon espace entreprise",
    description: (
      <p>
        <strong>Un compte unique</strong> pour accéder à vos candidatures, vos
        conventions et vos offres d’immersions.
      </p>
    ),
    cardsTitle: "Tous les avantages du compte entreprise",
    illustration: loginIllustration,
    cards: [
      {
        title: "Vos démarches centralisées",
        description:
          "Plus besoin de chercher dans vos emails ! Retrouvez toutes vos candidatures et conventions au même endroit.",
        illustration: commonIllustrations.warning,
      },
      {
        title: "Un accès simplifié",
        description:
          "Utilisez un seul identifiant pour vous connecter à l’ensemble des services de la Plateforme de l’Inclusion.",
        illustration: commonIllustrations.inscription,
      },
      {
        title: "Gérez vos offres",
        description:
          "Devenez administrateur de votre établissement et gérez directement vos offres d’immersions.",
        illustration: commonIllustrations.monCompte,
      },
    ],
  },
  agencyDashboard: {
    title: "Mon espace prescripteur",
    description: (
      <>
        <strong>Un compte unique</strong> pour accéder à vos conventions et
        consulter vos statistiques.
      </>
    ),
    cardsTitle: "Tous les avantages du compte prescripteur",
    illustration: loginIllustration,
    cards: [
      {
        title: "Une connexion simplifiée",
        description:
          "Pas besoin de créer un nouveau mot de passe si vous appartenez à France Travail, Cap Emploi...",
        illustration: commonIllustrations.warning,
      },
      {
        title: "Un seul identifiant",
        description:
          "Utilisez un seul identifiant pour vous connecter à l’ensemble des services de la Plateforme de l’Inclusion.",
        illustration: commonIllustrations.inscription,
      },
      {
        title: "Tout au même endroit",
        description:
          "Un seul espace pour accéder aux conventions et statistiques de vos organismes.",
        illustration: commonIllustrations.monCompte,
      },
    ],
  },
  admin: {
    title: "Mon espace administrateur",
    description: "Pour la super team IF 😉",
    illustration: loginIllustration,
  },
  default: {
    title: "Se connecter avec ProConnect",
    description:
      "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
    illustration: loginIllustration,
  },
};
