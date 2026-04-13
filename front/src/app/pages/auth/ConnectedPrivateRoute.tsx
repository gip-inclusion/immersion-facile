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
  type MainWrapperProps,
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
  immersionFacileHelpdeskRootUrl,
  immersionFacileNoReplyEmail,
  isFederatedIdentityProvider,
  makeUrlWithQueryParams,
  toLowerCaseWithoutDiacritics,
  withRedirectUriSchema,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontAdminRouteTab } from "src/app/pages/admin/AdminTabs";
import type { ConventionTemplatePageRoute } from "src/app/pages/convention/ConventionTemplatePage";
import { routes, useRoute } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { match, P } from "ts-pattern";
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
  "agencyManagement",
  "establishmentManagement",
  "statsEstablishmentDetails",
] satisfies AgencyDashboardRouteName[];

export type AgencyTabRoute = (typeof agencyDashboardTabsList)[number];

export const agencyDashboardRoutes = [
  "agencyDashboardMain",
  "agencyDashboardSynchronisedConventions",
  "agencyDashboardAgencies",
  "agencyDashboardAgencyDetails",
  "agencyDashboardOnboarding",
  "statsEstablishmentDetails",
  "agencyManagement",
  "establishmentManagement",
] satisfies AgencyDashboardRouteName[];

export type BeneficiaryDashboardRouteName =
  FrontBeneficiaryDashboardRoute["name"];

export type FrontBeneficiaryDashboardRoute =
  | Route<typeof routes.beneficiaryDashboard>
  | Route<typeof routes.beneficiaryDashboardDiscussions>;

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
  | Route<typeof routes.agencyManagement>
  | Route<typeof routes.establishmentManagement>
  | Route<typeof routes.statsEstablishmentDetails>;

export type FrontDashboardRoute =
  | FrontAgencyDashboardRoute
  | FrontEstablishmentDashboardRoute
  | FrontBeneficiaryDashboardRoute
  | ConventionTemplatePageRoute;

type ConnectPrivateRoute =
  | FrontAdminRoute
  | FrontDashboardRoute
  | Route<typeof routes.formEstablishment>
  | Route<typeof routes.myProfile>
  | Route<typeof routes.myProfileAgencies>
  | Route<typeof routes.myProfileEstablishments>
  | Route<typeof routes.myProfileEstablishmentRegistration>
  | Route<typeof routes.addAgency>
  | Route<typeof routes.manageConventionConnectedUser>;

type ConnectedPrivateRouteProps = {
  route: ConnectPrivateRoute;
  children: ReactNode;
  oAuthConnectionPageHeader: ReactElement;
  allowAdminOnly?: boolean;
  mainWrapperProps?: Omit<
    MainWrapperProps,
    "layout" | "children" | "useBackground" | "backgroundStyles"
  >;
};

export const loginByEmailFeedbackTopic: FeedbackTopic = "login-by-email";

export const ConnectedPrivateRoute = ({
  route,
  children,
  allowAdminOnly,
  mainWrapperProps,
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

  const page = getAllowedStartAuthPage(route.name, route.params);
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

                {match({
                  withEmailLogin: pageContent.withEmailLogin,
                  withProConnectLogin: pageContent.withProConnectLogin,
                })
                  .with(
                    { withEmailLogin: true, withProConnectLogin: true },
                    () => (
                      <SeparatedSection
                        firstSection={<LoginWithEmail page={page} />}
                        secondSection={
                          <LoginWithProConnect
                            page={page}
                            redirectUri={route.href}
                          />
                        }
                      />
                    ),
                  )
                  .with(
                    { withEmailLogin: true, withProConnectLogin: P.nullish },
                    () => (
                      <div
                        className={fr.cx(
                          "fr-grid-row",
                          "fr-grid-row--gutters",
                          "fr-grid-row--middle",
                        )}
                      >
                        <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
                          <LoginWithEmail page={page} />
                        </div>
                        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                          <img src={loginIllustration} alt="" />
                        </div>
                      </div>
                    ),
                  )
                  .with(
                    { withProConnectLogin: true, withEmailLogin: P.nullish },
                    () => (
                      <LoginWithProConnect
                        page={page}
                        redirectUri={route.href}
                      />
                    ),
                  )
                  .with(
                    {
                      withEmailLogin: P.nullish,
                      withProConnectLogin: P.nullish,
                    },
                    () => <p>Aucune méthode de connexion disponible</p>,
                  )
                  .exhaustive()}

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
              {pageContent.cardsTitle && (
                <h2 className={fr.cx("fr-h3")}>{pageContent.cardsTitle}</h2>
              )}
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
                      detail={
                        card.link ? (
                          <a
                            href={card.link.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {card.link.label}
                          </a>
                        ) : undefined
                      }
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
      <MainWrapper layout="default" {...mainWrapperProps}>
        {children}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const getAllowedStartAuthPage = (
  routeName: ConnectPrivateRoute["name"],
  routeParams: ConnectPrivateRoute["params"],
): AllowedLoginSource => {
<<<<<<< HEAD
  if (routeName === "myProfile") return "myProfile";
  if (routeName === "myProfileEstablishmentRegistration") return "myProfile";
=======
  if (routeName === "beneficiaryDashboardDiscussions")
    return "beneficiaryDashboardDiscussions";
  if (routeName === "beneficiaryDashboard") return "beneficiaryDashboard";
>>>>>>> de87a7166 (update: login view as beneficiary UI adjustments, fixed wording, add highlight on discussion listing)
  if (routeName === "establishmentDashboardDiscussions")
    return "establishmentDashboardDiscussions";
  if (routeName === "manageConventionConnectedUser")
    return "manageConventionUserConnected";
  if (
    agencyDashboardRoutes.includes(routeName as AgencyDashboardRouteName) &&
    "isAgencyRegistration" in routeParams &&
    (routeParams as { isAgencyRegistration?: boolean }).isAgencyRegistration
  )
    return "addAgency";
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

type PageContent = {
  title: string;
  description: ReactNode;
  cardsTitle?: string;
  cards?: {
    title: string;
    description: ReactNode;
    link?: {
      href?: string;
      label: string;
    };
    illustration: string;
  }[];
  illustration?: string;
} & (
  | { withEmailLogin: true; withProConnectLogin: true }
  | { withEmailLogin: true; withProConnectLogin?: never }
  | { withEmailLogin?: never; withProConnectLogin: true }
);

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
  withProConnectLogin: true,
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

const agencyDashboardContent: PageContent = {
  title: "Mon espace prescripteur",
  description: (
    <>
      <strong>Un compte unique</strong> pour accéder à vos conventions et
      consulter vos statistiques.
    </>
  ),
  cardsTitle: "Tous les avantages du compte prescripteur",
  withEmailLogin: true,
  withProConnectLogin: true,
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
};

const beneficiaryDashboardContent: PageContent = {
  title: "Mon espace bénéficiaire",
  description: (
    <>
      Un espace unique pour <strong>suivre vos candidatures</strong>.
    </>
  ),
  cardsTitle: "Votre parcours Immersion Facilitée",
  withEmailLogin: true,
  cards: [
    {
      title: "Gérer mes candidatures",
      description:
        "Retrouvez l'historique des candidatures que vous avez envoyées.",
      illustration: commonIllustrations.warning,
      link: {
        label: "Comment fonctionne l'espace candidat ?",
      },
    },
    {
      title: "Suivre ma convention",
      description:
        "La gestion des conventions arrive bientôt. En attendant, retrouvez notre guide pour suivre votre demande.",
      illustration: commonIllustrations.inscription,
      link: {
        href: `${immersionFacileHelpdeskRootUrl}/article/comment-suivre-ma-demande-de-convention-1gbhxt4/`,
        label: "Comment suivre ma demande de convention ?",
      },
    },
    {
      title: "S'orienter et s'informer",
      description:
        "Vous avez des questions sur l'immersion ou vous n'êtes pas encore accompagné ? Trouvez les réponses dans notre guide.",
      illustration: commonIllustrations.monCompte,
      link: {
        href: `${immersionFacileHelpdeskRootUrl}/category/candidat-jikpz1/`,
        label: "Consulter le centre d'aide",
      },
    },
  ],
};

const defaultPageContent: PageContent = {
<<<<<<< HEAD
  title: "Se connecter à Immersion Facilitée",
  description: (
    <>
      <strong>Un compte unique</strong> pour accéder à votre espace entreprise,
      prescripteur ou candidat.
    </>
  ),
  withEmailLogin: true,
=======
  title: "Se connecter avec ProConnect",
  description:
    "ProConnect est la solution proposée par l'État pour sécuriser et simplifier la connexion aux services en ligne pour les professionnels.",
  illustration: loginIllustration,
  withProConnectLogin: true,
>>>>>>> de87a7166 (update: login view as beneficiary UI adjustments, fixed wording, add highlight on discussion listing)
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
      withProConnectLogin: true,
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
    addAgency: {
      title: "Inscrire mon organisme",
      description: (
        <>
          L'inscription vous permet de{" "}
          <strong>valider les demandes d'immersion</strong> remplies sur
          Immersion Facilitée. Elle est accessible aux{" "}
          <a
            className={fr.cx("fr-link", "fr-text--lead")}
            href={`${immersionFacileHelpdeskRootUrl}/article/qui-peut-prescrire-une-immersion-6frnyn/`}
            target="_blank"
            rel="noreferrer"
          >
            prescripteurs de droit, structures d'accompagnement et prescripteurs
            délégataires
          </a>
          .
        </>
      ),
      cardsTitle: "Tous les avantages du compte prescripteur",
      withEmailLogin: true,
      withProConnectLogin: true,
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
    agencyDashboard: agencyDashboardContent,
    manageConventionUserConnected: agencyDashboardContent,
    admin: {
      title: "Mon espace administrateur",
      description: "Pour la super team IF 😉",
      withEmailLogin: true,
      withProConnectLogin: true,
    },
    conventionTemplate: defaultPageContent,
<<<<<<< HEAD
    myProfile: defaultPageContent,
=======
    beneficiaryDashboard: beneficiaryDashboardContent,
    beneficiaryDashboardDiscussions: beneficiaryDashboardContent,
>>>>>>> de87a7166 (update: login view as beneficiary UI adjustments, fixed wording, add highlight on discussion listing)
    default: defaultPageContent,
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
  const isRedirectUriAllowed = withRedirectUriSchema.safeParse({
    redirectUri,
  }).success;
  return (
    <>
      {!isRedirectUriAllowed && (
        <Alert
          severity="error"
          title="L'URL de redirection n'est pas autorisée"
        />
      )}
      <p>
        <strong>Connectez-vous avec ProConnect</strong>, et accédez à votre
        espace avec votre identité professionnelle sécurisée (24h de
        validation).
      </p>
      <div className={fr.cx("fr-my-2w")}>
        <ProConnectButton
          id={domElementIds[page].login.proConnectButton}
          url={makeUrlWithQueryParams(
            `/api${authRoutes.initiateLoginByOAuth.url}`,
            {
              redirectUri,
            },
          )}
        />
      </div>
    </>
  );
};
