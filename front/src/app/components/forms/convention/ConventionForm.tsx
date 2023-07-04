import React, { useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { zodResolver } from "@hookform/resolvers/zod";
import { match } from "ts-pattern";
import { useStyles } from "tss-react/dsfr";
import {
  Beneficiary,
  ConventionMagicLinkPayload,
  ConventionReadDto,
  conventionWithoutExternalIdSchema,
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
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { ConventionSummary } from "./ConventionSummary";
import { ShareConventionLink } from "./ShareConventionLink";
import { useUpdateConventionValuesInUrl } from "./useUpdateConventionValuesInUrl";

const useWaitForReduxFormUiReadyBeforeFormikInitialisation = (
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
  }, []);

  return reduxFormUiReady;
};

export type ConventionFormMode = "create" | "edit";

type ConventionFormProps = {
  internshipKind: InternshipKind;
  route:
    | ConventionImmersionPageRoute
    | ConventionMiniStagePageRoute
    | ConventionCustomAgencyPageRoute
    | ConventionImmersionForExternalsRoute;
  mode: ConventionFormMode;
};

export const ConventionForm = ({
  internshipKind,
  route,
  mode,
}: ConventionFormProps) => {
  const { cx } = useStyles();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const currentStep = useAppSelector(conventionSelectors.currentStep);
  const showSummary = useAppSelector(conventionSelectors.showSummary);
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
  const fetchedConvention: ConventionReadDto | null = useAppSelector(
    conventionSelectors.convention,
  );
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const dispatch = useDispatch();
  const getInitialFormValues = (mode: ConventionFormProps["mode"]) => {
    if (mode === "create") return initialValues;
    return fetchedConvention || initialValues;
  };

  const methods = useForm<ConventionReadDto>({
    defaultValues: getInitialFormValues(mode),
    resolver: zodResolver(conventionWithoutExternalIdSchema),
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
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
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
  }, []);

  useEffect(() => {
    if (fetchedConvention) {
      reset(fetchedConvention);
    }
  }, [fetchedConvention]);

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
    useWaitForReduxFormUiReadyBeforeFormikInitialisation(initialValues);

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
      })
        .with({ reduxFormUiReady: false }, () => null)
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
            <>
              <section>
                {isLoading && <Loader />}
                <ConventionSummary />
                <ConventionFeedbackNotification
                  submitFeedback={submitFeedback}
                  signatories={getValues("signatories")}
                />
                <ButtonsGroup
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
                      onClick: methods.handleSubmit(onConfirmSubmit),
                      nativeButtonProps: {
                        id: domElementIds.conventionImmersionRoute
                          .confirmSubmitFormButton,
                        disabled: isLoading,
                      },
                    },
                  ]}
                />
              </section>
            </>
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
                      description={t.intro.conventionWelcomeNotification}
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
