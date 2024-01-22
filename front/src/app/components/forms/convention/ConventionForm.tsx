import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { match } from "ts-pattern";
import { useStyles } from "tss-react/dsfr";
import { Route } from "type-route";
import {
  Beneficiary,
  ConventionId,
  ConventionJwtPayload,
  ConventionReadDto,
  conventionSchema,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  hasBeneficiaryCurrentEmployer,
  InternshipKind,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isPeConnectIdentity,
  notJobSeeker,
} from "shared";
import {
  ConventionFormLayout,
  ConventionFormSidebar,
  Loader,
  SubmitConfirmationSection,
} from "react-design-system";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { ConventionFormFields } from "src/app/components/forms/convention/ConventionFormFields";
import {
  ConventionPresentation,
  undefinedIfEmptyString,
} from "src/app/components/forms/convention/conventionHelpers";
import { sidebarStepContent } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useExistingSiret } from "src/app/hooks/siret.hooks";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { useMatomo } from "src/app/hooks/useMatomo";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { type ConventionCustomAgencyPageRoute } from "src/app/pages/convention/ConventionCustomAgencyPage";
import { type ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { type ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import { type ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import {
  conventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { routes, useRoute } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";
import { ConventionSummary } from "./ConventionSummary";
import { ShareConventionLink } from "./ShareConventionLink";
import { useUpdateConventionValuesInUrl } from "./useUpdateConventionValuesInUrl";

const {
  Component: ConfirmDuplicateConventionModal,
  open: openConfirmDuplicateConventionModal,
  close: closeConfirmDuplicateConventionModal,
} = createModal({
  id: "confirm-duplicate-convention-modal",
  isOpenedByDefault: false,
});

const useWaitForReduxFormUiReadyBeforeInitialisation = (
  initialValues: ConventionPresentation,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(isBeneficiaryMinor(initialValues)),
    );
    dispatch(
      conventionSlice.actions.isCurrentEmployerChanged(
        hasBeneficiaryCurrentEmployer(initialValues),
      ),
    );
    dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
      ),
    );
    setReduxFormUiReady(true);
  }, [dispatch, initialValues]);

  return reduxFormUiReady;
};

export type ConventionFormMode = "create" | "edit";

type ConventionFormProps = {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
};

type SupportedRoutes =
  | ConventionImmersionPageRoute
  | ConventionMiniStagePageRoute
  | ConventionCustomAgencyPageRoute
  | ConventionImmersionForExternalsRoute;

export const ConventionForm = ({
  internshipKind,
  mode,
}: ConventionFormProps) => {
  const { cx } = useStyles();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const currentStep = useAppSelector(conventionSelectors.currentStep);
  const showSummary = useAppSelector(conventionSelectors.showSummary);

  const route = useRoute() as SupportedRoutes;
  const conventionProperties = conventionInitialValuesFromUrl({
    route,
    internshipKind,
  });
  const sidebarContent = sidebarStepContent(
    conventionProperties?.internshipKind ?? "immersion",
  );
  const [initialValues] = useState<ConventionPresentation>({
    ...conventionProperties,
    signatories: {
      ...conventionProperties.signatories,
      beneficiary: makeInitialBenefiaryForm(
        conventionProperties.signatories.beneficiary,
        federatedIdentity,
      ),
    },
  });

  useExistingSiret(initialValues.siret);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const dispatch = useDispatch();
  const getInitialFormValues = (mode: ConventionFormProps["mode"]) => {
    if (mode === "create") return initialValues;
    return fetchedConvention || initialValues;
  };

  const methods = useForm<ConventionReadDto>({
    defaultValues: getInitialFormValues(mode),
    resolver: zodResolver(conventionSchema),
    mode: "onTouched",
  });
  const { getValues, reset } = methods;

  const formSuccessfullySubmitted = submitFeedback.kind === "justSubmitted";

  useUpdateConventionValuesInUrl(makeValuesToWatchInUrl(getValues()));
  useMatomo(conventionProperties.internshipKind);
  useScrollToTop(formSuccessfullySubmitted);

  useEffect(() => {
    if (mode === "create") {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(
        conventionSlice.actions.showSummaryChangeRequested({
          showSummary: false,
        }),
      );
    }

    if (mode === "edit" && route.params.jwt) {
      dispatch(conventionSlice.actions.jwtProvided(route.params.jwt));
      const { applicationId: conventionId } =
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
          route.params.jwt,
        );
      dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: route.params.jwt,
          conventionId,
        }),
      );
    }

    return () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(conventionSlice.actions.clearFeedbackTriggered());
    };
  }, [dispatch, mode, route.params.jwt]);

  useEffect(() => {
    if (fetchedConvention) {
      reset(fetchedConvention);
    }
  }, [fetchedConvention, reset]);

  const onConfirmSubmit = () => {
    if (!fetchedConvention) return;
    // TODO : show feedback if convention is null
    dispatch(
      conventionSlice.actions.saveConventionRequested({
        ...fetchedConvention,
        status: "READY_TO_SIGN",
      }),
    );
  };
  const onSubmit: SubmitHandler<ConventionReadDto> = (values) => {
    const conventionToSave = {
      ...values,
      workConditions: undefinedIfEmptyString(values.workConditions),
    };
    dispatch(
      conventionSlice.actions.showSummaryChangeRequested({
        showSummary: true,
        convention: conventionToSave,
      }),
    );
  };
  const reduxFormUiReady =
    useWaitForReduxFormUiReadyBeforeInitialisation(initialValues);

  const t = useConventionTexts(initialValues.internshipKind);

  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton();
  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {match({
        showSummary,
        reduxFormUiReady,
        formSuccessfullySubmitted,
        shouldRedirectToError: !!(route.params.jwt && fetchConventionError),
        conventionCantBeEdited:
          mode === "edit" &&
          route.params.jwt &&
          fetchedConvention &&
          fetchedConvention?.status !== "DRAFT",
      })
        .with({ reduxFormUiReady: false }, () => <Loader />)
        .with({ conventionCantBeEdited: true }, () => (
          <Alert
            severity="error"
            title="Cette convention ne peut plus être modifiée"
            description="Cette convention ne peut plus être modifiée car elle a déjà été signée, validée ou refusée."
          />
        ))
        .with({ shouldRedirectToError: true }, () => (
          <>
            {route.params.jwt && fetchConventionError && (
              <ShowErrorOrRedirectToRenewMagicLink
                errorMessage={fetchConventionError}
                jwt={route.params.jwt}
              />
            )}
          </>
        ))
        .with({ formSuccessfullySubmitted: true }, () => (
          <SubmitConfirmationSection
            idToCopy={getValues().id}
            copyButtonIsDisabled={copyButtonIsDisabled}
            copyButtonLabel={copyButtonLabel}
            onCopyButtonClick={onCopyButtonClick}
          />
        ))
        .with(
          {
            showSummary: true,
            formSuccessfullySubmitted: false,
          },
          () => (
            <ConventionSummarySection
              methods={methods}
              onConfirmSubmit={onConfirmSubmit}
              isLoading={isLoading}
              submitFeedback={submitFeedback}
            />
          ),
        )
        .with(
          {
            showSummary: false,
            formSuccessfullySubmitted: false,
          },
          () => (
            <FormProvider {...methods}>
              <ConventionFormLayout
                form={
                  <>
                    <div className={cx("fr-text")}>{t.intro.welcome}</div>
                    <Alert
                      severity="info"
                      small
                      description={
                        route.params.jwt
                          ? t.intro.conventionModificationNotification(
                              fetchedConvention?.statusJustification,
                            )
                          : t.intro.conventionCreationNotification
                      }
                    />

                    <p className={fr.cx("fr-text--xs", "fr-mt-3w")}>
                      Tous les champs marqués d'une astérisque (*) sont
                      obligatoires.
                    </p>

                    <form>
                      <ConventionFormFields onSubmit={onSubmit} mode={mode} />
                      <ConventionFeedbackNotification
                        submitFeedback={submitFeedback}
                        signatories={getValues("signatories")}
                      />
                    </form>
                  </>
                }
                sidebar={
                  <ConventionFormSidebar
                    currentStep={currentStep}
                    sidebarContent={sidebarContent}
                    sidebarFooter={
                      <div
                        className={fr.cx(
                          "fr-btns-group",
                          "fr-btns-group--center",
                          "fr-btns-group--inline",
                          "fr-btns-group--sm",
                          "fr-btns-group--icon-left",
                        )}
                      >
                        <ShareConventionLink />
                        <Button
                          type="submit"
                          onClick={methods.handleSubmit(onSubmit)}
                        >
                          Envoyer la convention
                        </Button>
                      </div>
                    }
                  />
                }
              />
            </FormProvider>
          ),
        )
        .exhaustive()}
    </div>
  );
};

const makeInitialBenefiaryForm = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
  federatedIdentityWithUser: FederatedIdentityWithUser | null,
): Beneficiary<"immersion" | "mini-stage-cci"> => {
  const { federatedIdentity, ...beneficiaryOtherProperties } = beneficiary;
  const peConnectIdentity =
    federatedIdentityWithUser && isPeConnectIdentity(federatedIdentityWithUser)
      ? federatedIdentityWithUser
      : undefined;
  const federatedIdentityValue = federatedIdentity ?? peConnectIdentity;

  return {
    ...beneficiaryOtherProperties,
    ...(federatedIdentityValue?.token !== notJobSeeker && {
      federatedIdentity: federatedIdentityValue,
    }),
  };
};

const ConventionSummarySection = (props: {
  isLoading: boolean;
  submitFeedback: ConventionSubmitFeedback;
  methods: UseFormReturn<ConventionReadDto>;
  onConfirmSubmit: () => void;
}) => {
  const { getValues } = props.methods;
  const dispatch = useDispatch();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const convention = useAppSelector(conventionSelectors.convention);
  const similarConventionIds = useAppSelector(
    conventionSelectors.similarConventionIds,
  );
  const route = useRoute() as Route<typeof routes.conventionImmersion>;

  const isEditingConvention = !!route.params.jwt;
  const shouldShowDuplicateWarning =
    !isEditingConvention && similarConventionIds.length > 0;

  useEffect(() => {
    if (!convention) return;
    dispatch(
      conventionSlice.actions.getSimilarConventionsRequested({
        codeAppellation: convention.immersionAppellation.appellationCode,
        siret: convention.siret,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        dateStart: convention.dateStart,
        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
      }),
    );
  }, []);

  return (
    <section>
      {props.isLoading && <Loader />}
      <ConventionSummary />
      <ConventionFeedbackNotification
        submitFeedback={props.submitFeedback}
        signatories={getValues("signatories")}
      />
      {shouldShowDuplicateWarning && (
        <DuplicateConventionAlert similarConventionIds={similarConventionIds} />
      )}
      <ButtonsGroup
        className={fr.cx("fr-mt-4w")}
        inlineLayoutWhen="sm and up"
        alignment="center"
        buttons={[
          {
            children: "Modifier la convention",
            onClick: () => {
              dispatch(
                conventionSlice.actions.showSummaryChangeRequested({
                  showSummary: false,
                }),
              );
            },
            priority: "secondary",
          },
          {
            children: "Envoyer la convention",
            onClick: (event) =>
              shouldShowDuplicateWarning
                ? openConfirmDuplicateConventionModal()
                : props.methods.handleSubmit(props.onConfirmSubmit)(event),
            nativeButtonProps: {
              id: domElementIds.conventionImmersionRoute
                .confirmSubmitFormButton,
              disabled: isLoading,
            },
          },
        ]}
      />
      {createPortal(
        <ConfirmDuplicateConventionModal
          title={"Confirmer la création de cette convention"}
        >
          <DuplicateConventionAlert
            similarConventionIds={similarConventionIds}
          />
          <ButtonsGroup
            className={fr.cx("fr-mt-4w")}
            inlineLayoutWhen="sm and up"
            alignment="center"
            buttons={[
              {
                children: "Annuler",
                onClick: closeConfirmDuplicateConventionModal,
                priority: "secondary",
              },
              {
                children: "Valider (au risque de créer un doublon)",
                onClick: props.methods.handleSubmit(props.onConfirmSubmit),
                nativeButtonProps: {
                  disabled: isLoading,
                },
              },
            ]}
          />
        </ConfirmDuplicateConventionModal>,
        document.body,
      )}
    </section>
  );
};

const DuplicateConventionAlert = (props: {
  similarConventionIds: ConventionId[];
}) => (
  <Alert
    severity={"warning"}
    title={"Attention ! Possible convention en doublon."}
    description={
      <div>
        {props.similarConventionIds.length === 1
          ? "Une convention a déjà été initiée avec des informations similaires. Voici son identifiant :"
          : "Des conventions ont déjà été initiées avec des informations similaires. Voici leurs identifiants :"}
        <ul>
          {props.similarConventionIds.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>
    }
  />
);
