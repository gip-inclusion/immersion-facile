import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Tile from "@codegouvfr/react-dsfr/Tile";
import { zodResolver } from "@hookform/resolvers/zod";

import { type ReactElement, type ReactNode, useEffect } from "react";
import {
  Loader,
  MainWrapper,
  PageHeader,
  SeparatedSection,
} from "react-design-system";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type AllowedLoginSource,
  absoluteUrlSchema,
  authRoutes,
  domElementIds,
  type Email,
  emailSchema,
  immersionFacileNoReplyEmail,
  isFederatedIdentityProvider,
  queryParamsAsString,
  toLowerCaseWithoutDiacritics,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontAdminRouteTab } from "src/app/pages/admin/AdminTabs";
import { routes, useRoute } from "src/app/routes/routes";
import {
  commonIllustrations,
  loginIllustration,
} from "src/assets/img/illustrations";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import type { Route } from "type-route";
import { z } from "zod";
import { WithFeedbackReplacer } from "../../components/feedback/WithFeedbackReplacer";
import { EmailValidationInput } from "../../components/forms/commons/EmailValidationInput";
import { makeFieldError } from "../../hooks/formContents.hooks";
import { LoginByEmailFeedbackPage } from "./LoginByEmailFeedbackPage";

export type FrontAdminRoute =
  | FrontAdminRouteTab
  | Route<typeof routes.adminUserDetail>
  | Route<typeof routes.adminConventionDetail>
  | Route<typeof routes.adminAgencyDetail>;

export const agencyDashboardTabsList = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
  "agencyDashboardStatsAgencies",
  "agencyDashboardStatsEstablishmentDetails",
  "agencyDashboardStatsConventionsByEstablishmentByDepartment",
] satisfies AgencyDashboardRouteName[];

export type AgencyTabRoute = (typeof agencyDashboardTabsList)[number];

export const agencyDashboardRoutes = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
  "agencyDashboardAgencyDetails",
  "agencyDashboardOnboarding",
  "agencyDashboardStatsAgencies",
  "agencyDashboardStatsEstablishmentDetails",
  "agencyDashboardStatsConventionsByEstablishmentByDepartment",
] satisfies AgencyDashboardRouteName[];

export type EstablishmentDashboardRouteName =
  FrontEstablishmentDashboardRoute["name"];

export type FrontEstablishmentDashboardRoute =
  | Route<typeof routes.establishmentDashboard>
  | Route<typeof routes.establishmentDashboardConventions>
  | Route<typeof routes.establishmentDashboardFormEstablishment>
  | Route<typeof routes.establishmentDashboardDiscussions>;

export const establishmentDashboardRoutes = [
  "establishmentDashboard",
  "establishmentDashboardConventions",
  "establishmentDashboardFormEstablishment",
  "establishmentDashboardDiscussions",
] satisfies EstablishmentDashboardRouteName[];

export type AgencyDashboardRouteName = FrontAgencyDashboardRoute["name"];

export type FrontAgencyDashboardRoute =
  | Route<typeof routes.agencyDashboardMain>
  | Route<typeof routes.agencyDashboardOnboarding>
  | Route<typeof routes.agencyDashboardSynchronisedConventions>
  | Route<typeof routes.agencyDashboardAgencies>
  | Route<typeof routes.agencyDashboardAgencyDetails>
  | Route<typeof routes.agencyDashboardStatsAgencies>
  | Route<typeof routes.agencyDashboardStatsEstablishmentDetails>
  | Route<
      typeof routes.agencyDashboardStatsConventionsByEstablishmentByDepartment
    >;

export type FrontDashboardRoute =
  | FrontAgencyDashboardRoute
  | FrontEstablishmentDashboardRoute;

type ConnectPrivateRoute =
  | FrontAdminRoute
  | FrontDashboardRoute
  | Route<typeof routes.formEstablishment>
  | Route<typeof routes.myProfile>;

type ConnectedPrivateRouteProps = {
  route: ConnectPrivateRoute;
  children: ReactElement;
  oAuthConnectionPageHeader: ReactElement;
  allowAdminOnly?: boolean;
};

export const loginByEmailFeedbackTopic: FeedbackTopic = "login-by-email";

export const ConnectedPrivateRoute = ({
  route,
  children,
  allowAdminOnly,
}: ConnectedPrivateRouteProps) => {
  const dispatch = useDispatch();
  const isConnectedUser = useAppSelector(authSelectors.isConnectedUser);
  const authIsLoading = useAppSelector(authSelectors.isLoading);
  const isLoadingUser = useAppSelector(connectedUserSelectors.isLoading);
  const isAdminConnected = useAppSelector(authSelectors.isAdminConnected);

  const afterLoginRedirectionUrl = useAppSelector(
    authSelectors.afterLoginRedirectionUrl,
  );

  useEffect(() => {
    const {
      token,
      provider,
      email = "",
      firstName = "",
      lastName = "",
      idToken = "",
    } = route.params;

    if (token && provider && isFederatedIdentityProvider(provider)) {
      dispatch(
        authSlice.actions.federatedIdentityProvided({
          federatedIdentityWithUser: {
            provider,
            token,
            email,
            lastName,
            firstName,
            idToken,
          },
          feedbackTopic: "auth-global",
        }),
      );

      const { token: _, ...routeParams } = route.params;
      routes[route.name](routeParams as any).replace();
    }
  }, [route.params, dispatch, route.name]);

  useEffect(() => {
    if (!authIsLoading && !isConnectedUser) {
      const windowUrl = absoluteUrlSchema.parse(window.location.href);
      dispatch(
        authSlice.actions.saveRedirectionAfterLoginRequested({
          url: windowUrl,
        }),
      );
    }
    if (!authIsLoading && isConnectedUser && afterLoginRedirectionUrl)
      dispatch(authSlice.actions.redirectAndClearUrlAfterLoginRequested());
  }, [authIsLoading, isConnectedUser, afterLoginRedirectionUrl, dispatch]);

  const page = getAllowedStartAuthPage(route.name);
  const pageContent = pageContentByRoute[page] ?? pageContentByRoute.default;
  const alreadyUsedAuthentication = route.params.alreadyUsedAuthentication;

  if (!isConnectedUser) {
    return (
      <WithFeedbackReplacer
        topic={loginByEmailFeedbackTopic}
        renderFeedback={({ level }) => (
          <LoginByEmailFeedbackPage
            mode={level === "success" ? "success" : "failed"}
            page={page}
          />
        )}
      >
        <HeaderFooterLayout>
          <MainWrapper
            layout="default"
            pageHeader={
              <PageHeader
                title={pageContent.title}
                illustration={
                  "illustration" in pageContent
                    ? pageContent.illustration
                    : undefined
                }
              >
                {alreadyUsedAuthentication && (
                  <Alert
                    className={fr.cx("fr-mb-2w")}
                    severity="warning"
                    title="Ce lien d'authentification a déjà été utilisé."
                    description="Veuillez renouveler votre demande de connexion."
                  />
                )}
                <p className={fr.cx("fr-text--lead")}>
                  {pageContent.description}
                </p>
                {"withEmailLogin" in pageContent ? (
                  <SeparatedSection
                    firstSection={<LoginWithEmail page={page} />}
                    secondSection={
                      <LoginWithProConnect
                        page={page}
                        redirectUri={route.href}
                      />
                    }
                  />
                ) : (
                  <LoginWithProConnect page={page} redirectUri={route.href} />
                )}

                <p className={fr.cx("fr-hint-text")}>
                  Si votre messagerie est protégée une anti-spam, pensez à
                  ajouter l’adresse{" "}
                  <strong>{immersionFacileNoReplyEmail}</strong> à votre liste
                  de contacts autorisés.
                </p>
              </PageHeader>
            }
            vSpacing={2}
          >
            <section className={fr.cx("fr-mb-8w")}>
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
      </WithFeedbackReplacer>
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

const getAllowedStartAuthPage = (
  routeName: ConnectPrivateRoute["name"],
): AllowedLoginSource => {
  if (routeName === "establishmentDashboardDiscussions")
    return "establishmentDashboardDiscussions";
  if (
    establishmentDashboardRoutes.includes(
      routeName as EstablishmentDashboardRouteName,
    )
  )
    return "establishmentDashboard";
  if (agencyDashboardRoutes.includes(routeName as AgencyDashboardRouteName))
    return "agencyDashboard";
  if (routeName === "formEstablishment") return "establishment";
  return "admin";
};

type PageContent = (
  | {
      withEmailLogin: true;
    }
  | { illustration: string }
) & {
  title: string;
  description: ReactNode;
  cardsTitle?: string;
  cards?: {
    title: string;
    description: ReactNode;
    link?: string;
    illustration: string;
  }[];
};

const establishmentDashboardContent: PageContent = {
  title: "Mon espace entreprise",
  description: (
    <>
      <strong>Un compte unique</strong> pour accéder à vos candidatures, vos
      conventions et vos offres d’immersions.
    </>
  ),
  cardsTitle: "Tous les avantages du compte entreprise",
  withEmailLogin: true,
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
};

const pageContentByRoute: Record<AllowedLoginSource | "default", PageContent> =
  {
    establishment: {
      title: "Proposer une immersion",
      description: (
        <>
          <strong>Un compte unique</strong> pour publier et mettre à jour vos
          offres d’immersion. Vous pourrez aussi suivre et gérez toutes les
          candidatures reçues en un seul endroit.
        </>
      ),
      cardsTitle: "Tous les avantages du compte entreprise",
      withEmailLogin: true,
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
    establishmentDashboard: establishmentDashboardContent,
    establishmentDashboardDiscussions: establishmentDashboardContent,
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
      withEmailLogin: true,
    },
    default: {
      title: "Se connecter avec ProConnect",
      description:
        "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
      illustration: loginIllustration,
    },
  };

const LoginWithEmail = ({ page }: { page: AllowedLoginSource }) => {
  const route = useRoute();
  const methods = useForm<{
    email: Email;
  }>({
    resolver: zodResolver(z.object({ email: emailSchema })),
    mode: "onTouched",
  });
  const dispatch = useDispatch();
  const getFieldError = makeFieldError(methods.formState);
  const isRequestingLoginByEmail = useAppSelector(
    authSelectors.isRequestingLoginByEmail,
  );
  return (
    <>
      {isRequestingLoginByEmail && <Loader />}
      <p>
        <strong>Continuer avec un email</strong>, et recevez un lien directement
        pour accéder à votre espace sans délai.
      </p>
      <div className={fr.cx("fr-my-2w")}>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(({ email }) => {
              dispatch(
                authSlice.actions.loginByEmailRequested({
                  email,
                  redirectUri: route.href,
                  feedbackTopic: loginByEmailFeedbackTopic,
                }),
              );
            })}
          >
            <EmailValidationInput
              label={"Email"}
              nativeInputProps={{
                ...methods.register("email", {
                  setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
                }),
                onBlur: (event) => {
                  methods.setValue(
                    "email",
                    toLowerCaseWithoutDiacritics(event.currentTarget.value),
                  );
                },
              }}
              {...getFieldError("email")}
            />
            <Button id={domElementIds[page].login.byEmailButton}>
              Recevoir le lien de connexion
            </Button>
          </form>
        </FormProvider>
      </div>
    </>
  );
};

const LoginWithProConnect = ({
  redirectUri,
  page,
}: {
  redirectUri: string;
  page: AllowedLoginSource;
}) => {
  const queryParamsResult = authRoutes.initiateLoginByOAuth.queryParamsSchema[
    "~standard"
  ].validate({ redirectUri });

  if (queryParamsResult instanceof Promise) {
    throw new TypeError("Schema validation must be synchronous");
  }

  if (queryParamsResult.issues) {
    throw new Error(
      `Query params format is not valid. ${queryParamsResult.issues.map((issue) => `${issue.path?.join(".")}: ${issue.message}`).join(", ")}`,
    );
  }

  return (
    <>
      <p>
        <strong>Connectez-vous avec ProConnect</strong>, et accédez à votre
        espace avec votre identité professionnelle sécurisée (24h de
        validation).
      </p>
      <div className={fr.cx("fr-my-2w")}>
        <ProConnectButton
          id={domElementIds[page].login.proConnectButton}
          url={`/api${authRoutes.initiateLoginByOAuth.url}?${queryParamsAsString(
            queryParamsResult.value,
          )}`}
        />
      </div>
    </>
  );
};
