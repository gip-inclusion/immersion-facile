import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";
import Tile from "@codegouvfr/react-dsfr/Tile";
import { zodResolver } from "@hookform/resolvers/zod";

import { type ReactElement, type ReactNode, useEffect, useState } from "react";
import {
  Loader,
  MainWrapper,
  PageHeader,
  SeparatedSection,
} from "react-design-system";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type AllowedStartOAuthLoginPage,
  type Email,
  absoluteUrlSchema,
  domElementIds,
  emailSchema,
  immersionFacileNoReplyEmail,
  inclusionConnectImmersionRoutes,
  isFederatedIdentityProvider,
  queryParamsAsString,
  toLowerCaseWithoutDiacritics,
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
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import type { Route } from "type-route";
import { z } from "zod";
import { LoginByEmailFeedback } from "../components/feedback/LoginByEmailFeedback";
import { WithFeedbackReplacer } from "../components/feedback/WithFeedbackReplacer";
import { EmailValidationInput } from "../components/forms/commons/EmailValidationInput";
import { makeFieldError } from "../hooks/formContents.hooks";

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

export type EstablishmentDashboardRouteName =
  FrontEstablishmentDashboardRoute["name"];

export type FrontEstablishmentDashboardRoute =
  | Route<typeof routes.establishmentDashboard>
  | Route<typeof routes.establishmentDashboardConventions>
  | Route<typeof routes.establishmentDashboardFicheEntreprise>
  | Route<typeof routes.establishmentDashboardDiscussionDetail>;

export type AgencyDashboardRouteName = FrontAgencyDashboardRoute["name"];

export type FrontAgencyDashboardRoute =
  | Route<typeof routes.agencyDashboardMain>
  | Route<typeof routes.agencyDashboardOnboarding>
  | Route<typeof routes.agencyDashboardSynchronisedConventions>
  | Route<typeof routes.agencyDashboardAgencies>
  | Route<typeof routes.agencyDashboardAgencyDetails>;

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
  inclusionConnectConnexionPageHeader: ReactElement;
  allowAdminOnly?: boolean;
};

export const loginByEmailFeedbackTopic: FeedbackTopic = "login-by-email";

export const ConnectedPrivateRoute = ({
  route,
  children,
  allowAdminOnly,
}: ConnectedPrivateRouteProps) => {
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
  const alreadyUsedAuthentication = route.params.alreadyUsedAuthentication;

  if (!isInclusionConnected) {
    return (
      <WithFeedbackReplacer
        topic={loginByEmailFeedbackTopic}
        renderFeedback={({ level }) => (
          <LoginByEmailFeedback
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
                <>
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
                      secondSection={<LoginWithProConnect page={page} />}
                    />
                  ) : (
                    <LoginWithProConnect page={page} />
                  )}

                  <p className={fr.cx("fr-hint-text")}>
                    Si votre messagerie est protégée une anti-spam, pensez à
                    ajouter l’adresse{" "}
                    <strong>{immersionFacileNoReplyEmail}</strong> à votre liste
                    de contacts autorisés.
                  </p>
                </>
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

const getPage = (route: ConnectPrivateRoute): AllowedStartOAuthLoginPage => {
  if (route.name === "establishmentDashboard") return "establishmentDashboard";
  if (route.name === "agencyDashboardMain") return "agencyDashboard";
  if (route.name === "formEstablishment") return "establishment";
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

const pageContentByRoute: Record<
  AllowedStartOAuthLoginPage | "default",
  PageContent
> = {
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
  establishmentDashboard: {
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
    withEmailLogin: true,
  },
  default: {
    title: "Se connecter avec ProConnect",
    description:
      "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
    illustration: loginIllustration,
  },
};

const LoginWithEmail = ({ page }: { page: AllowedStartOAuthLoginPage }) => {
  const methods = useForm<{
    email: Email;
  }>({
    resolver: zodResolver(z.object({ email: emailSchema })),
    mode: "onTouched",
  });
  const dispatch = useDispatch();
  const getFieldError = makeFieldError(methods.formState);
  const [invalidEmailMessage, setInvalidEmailMessage] =
    useState<ReactNode | null>(null);
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
                  page,
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
              onEmailValidationFeedback={({ state, stateRelatedMessage }) =>
                setInvalidEmailMessage(
                  state === "error" ? stateRelatedMessage : null,
                )
              }
            />
            <Button id={domElementIds[page].login.byEmailButton}>
              Recevoir le lien de connexion
            </Button>
          </form>
        </FormProvider>
        {invalidEmailMessage !== null && (
          <Alert
            severity="error"
            title="Email invalide"
            description={`L'email de contact que vous avez utilisé dans le formulaire de contact a été invalidé par notre vérificateur d'email pour la raison suivante : ${invalidEmailMessage}`}
          />
        )}
      </div>
    </>
  );
};

const LoginWithProConnect = ({
  page,
}: { page: AllowedStartOAuthLoginPage }) => {
  const queryParamsResult =
    inclusionConnectImmersionRoutes.startInclusionConnectLogin.queryParamsSchema[
      "~standard"
    ].validate({ page });

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
          url={`/api${inclusionConnectImmersionRoutes.startInclusionConnectLogin.url}?${queryParamsAsString(
            queryParamsResult.value,
          )}`}
        />
      </div>
    </>
  );
};
