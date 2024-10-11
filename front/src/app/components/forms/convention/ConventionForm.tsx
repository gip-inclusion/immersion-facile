import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React, {
  Dispatch,
  ElementRef,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConventionFormLayout,
  ConventionFormSidebar,
  ErrorNotifications,
  Loader,
} from "react-design-system";
import { FormProvider, SubmitHandler, get, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  AgencyKindFilter,
  Beneficiary,
  ConventionReadDto,
  DepartmentCode,
  FederatedIdentity,
  InternshipKind,
  addressDtoToString,
  conventionSchema,
  domElementIds,
  hasBeneficiaryCurrentEmployer,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isPeConnectIdentity,
  keys,
  notJobSeeker,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import { BeneficiaryFormSection } from "src/app/components/forms/convention/sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "src/app/components/forms/convention/sections/establishment/EstablishmentFormSection";
import { ImmersionDetailsSection } from "src/app/components/forms/convention/sections/immersion-details/ImmersionDetailsSection";
import { ScheduleSection } from "src/app/components/forms/convention/sections/schedule/ScheduleSection";
import {
  formConventionFieldsLabels,
  formUiSections,
  sidebarStepContent,
} from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";

import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import {
  ConventionPresentation,
  undefinedIfEmptyString,
} from "src/app/components/forms/convention/conventionHelpers";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConventionFormMode,
  SupportedConventionRoutes,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import { useUpdateConventionValuesInUrl } from "src/app/components/forms/convention/useUpdateConventionValuesInUrl";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useExistingSiret } from "src/app/hooks/siret.hooks";
import { useMatomo } from "src/app/hooks/useMatomo";
import {
  getConventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { useRoute } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  NumberOfSteps,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { useStyles } from "tss-react/dsfr";
import { ShareConventionLink } from "./ShareConventionLink";

type StepSeverity = "error" | "success" | "info";
export type EmailValidationErrorsState = Partial<
  Record<
    | "Bénéficiaire"
    | "Responsable d'entreprise"
    | "Tuteur de l'entreprise"
    | "Représentant légal du bénéficiaire"
    | "Employeur actuel du bénéficiaire",
    React.ReactNode
  >
>;
export type SetEmailValidationErrorsState = Dispatch<
  SetStateAction<EmailValidationErrorsState>
>;

export const ConventionForm = ({
  mode,
  internshipKind,
}: {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
}) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const route = useRoute() as SupportedConventionRoutes;

  const fetchedConvention = useAppSelector(conventionSelectors.convention);

  const currentStep = useAppSelector(conventionSelectors.currentStep);
  const conventionSubmitFeedback = useAppSelector(conventionSelectors.feedback);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const submitFeedback = useAppSelector(conventionSelectors.feedback);

  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const establishmentNumberEmployeesRange = useAppSelector(
    siretSelectors.establishmentInfos,
  )?.numberEmployeesRange;

  const agencyOptions = useSelector(agenciesSelectors.options);
  const agenciesFeedback = useSelector(agenciesSelectors.feedback);
  const isAgenciesLoading = useSelector(agenciesSelectors.isLoading);
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const conventionInitialValuesFromUrl = getConventionInitialValuesFromUrl({
    route,
    internshipKind,
  });
  const acquisitionParams = useGetAcquisitionParams();

  const initialValues = useRef<ConventionPresentation>({
    ...conventionInitialValuesFromUrl,
    ...acquisitionParams,
    signatories: {
      ...conventionInitialValuesFromUrl.signatories,
      beneficiary: makeInitialBenefiaryForm(
        conventionInitialValuesFromUrl.signatories.beneficiary,
        federatedIdentity,
      ),
    },
  }).current;
  useExistingSiret(initialValues.siret);

  const reduxFormUiReady =
    useWaitForReduxFormUiReadyBeforeInitialisation(initialValues);
  const defaultValues =
    mode === "create" ? initialValues : fetchedConvention || initialValues;
  const methods = useForm<ConventionReadDto>({
    defaultValues,
    resolver: zodResolver(conventionSchema),
    mode: "onTouched",
  });

  const {
    handleSubmit,
    setValue,
    trigger,
    clearErrors,
    getValues,
    getFieldState,
    formState,
    reset,
  } = methods;

  const { errors, submitCount, isSubmitted } = formState;

  const conventionValues = getValues();

  useUpdateConventionValuesInUrl(
    makeValuesToWatchInUrl({
      ...conventionValues,
      fromPeConnectedUser: route.params.fromPeConnectedUser,
    }),
  );

  const { getFormFields, getFormErrors } = getFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const getFieldError = makeFieldError(formState);
  const formContents = getFormFields();

  const t = useConventionTexts(conventionValues.internshipKind);

  const sidebarContent = sidebarStepContent(
    conventionValues.internshipKind ?? "immersion",
  );

  const onSubmit: SubmitHandler<ConventionReadDto> = (convention) => {
    const conventionToSave: ConventionReadDto = {
      ...convention,
      workConditions: undefinedIfEmptyString(convention.workConditions),
      establishmentNumberEmployeesRange:
        establishmentNumberEmployeesRange === ""
          ? undefined
          : establishmentNumberEmployeesRange,
    };
    dispatch(
      conventionSlice.actions.showSummaryChangeRequested({
        showSummary: true,
        convention: conventionToSave,
      }),
    );
  };

  const accordionsRef = useRef<Array<ElementRef<"div">>>([]);

  const [stepsStatus, setStepsStatus] = useState<Record<
    number,
    StepSeverity
  > | null>(null);

  const [emailValidationErrors, setEmailValidationErrors] =
    useState<EmailValidationErrorsState>({});

  const shouldSubmitButtonBeDisabled =
    isLoading ||
    (isSubmitted && conventionSubmitFeedback.kind === "justSubmitted") ||
    keys(emailValidationErrors).length > 0;

  const {
    agencyId: agencyIdField,
    agencyDepartment: agencyDepartmentField,
    agencyKind: agencyKindField,
  } = getFormFields();

  const onDepartmentCodeChangedMemoized = useCallback(
    (departmentCode: DepartmentCode) =>
      dispatch(
        agenciesSlice.actions.fetchAgencyOptionsRequested({
          filterKind: makeListAgencyOptionsKindFilter({
            internshipKind: conventionValues.internshipKind,
            shouldListAll: false,
            federatedIdentity,
          }),
          departmentCode,
        }),
      ),
    [dispatch, conventionValues.internshipKind, federatedIdentity],
  );

  const makeAccordionProps = (step: NumberOfSteps) => ({
    ref: (element: HTMLDivElement) => {
      accordionsRef.current[step - 1] = element;
      return element;
    },
    onExpandedChange: async () => {
      await validateSteps("clearAllErrors");
      setTimeout(() => {
        // we need to wait for the accordion to shrink / expand before scrolling (otherwise the scroll is not accurate)
        accordionsRef.current[step - 1]?.scrollIntoView({
          behavior: "smooth",
        });
      }, 400);
      dispatch(conventionSlice.actions.setCurrentStep(step));
    },
    expanded: currentStep === step,
    id: `im-convention-form__step-${step - 1}`,
  });

  const shouldLockToPeAgencies = !!(
    route.name === "conventionImmersion" &&
    route.params.jwt &&
    isPeConnectIdentity(
      conventionValues?.signatories.beneficiary.federatedIdentity,
    )
  );

  const validateSteps = async (type: "clearAllErrors" | "doNotClear") => {
    const stepsDataValue = await Promise.all(
      formUiSections.map((_, step) => getStepData(step + 1)),
    );
    setStepsStatus(stepsDataValue.reduce((acc, curr) => ({ ...acc, ...curr })));
    if (type === "clearAllErrors") {
      console.info("CLEAR ALL ERRORS");
      clearErrors();
    }
  };

  const getStepData = async (
    step: number,
  ): Promise<Record<number, StepSeverity>> => {
    const stepFields = formUiSections[step - 1];
    const validatedFields = stepFields.map(async (field) => ({
      [field]: await trigger(field as keyof ConventionReadDto),
    }));
    const validatedFieldsValue = await Promise.all(validatedFields);
    const getStepStatus = () => {
      const stepHasErrors = stepFields.filter(
        (stepField) =>
          keys(errors).filter((errorKey) => stepField.includes(errorKey))
            .length && get(errors, stepField),
      ).length;
      const stepIsTouched = stepFields.filter(
        (stepField) =>
          getFieldState(stepField as keyof ConventionReadDto).isTouched,
      ).length;
      if (validatedFieldsValue.every((field) => Object.values(field)[0])) {
        return "success";
      }
      if (stepHasErrors && stepIsTouched) {
        return "error";
      }
      return "info";
    };
    return {
      [step]: getStepStatus(),
    };
  };

  useMatomo(conventionInitialValuesFromUrl.internshipKind);

  useEffect(() => {
    outOfReduxDependencies.localDeviceRepository.delete(
      "partialConventionInUrl",
    );
    dispatch(conventionSlice.actions.setCurrentStep(1));
  }, []);

  useEffect(() => {
    if (mode !== "create") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      validateSteps("clearAllErrors");
    }
  }, [conventionValues.id]);

  useEffect(() => {
    if (route.name === "conventionCustomAgency" && preselectedAgencyId) {
      setValue("agencyId", preselectedAgencyId);
    }
  }, [preselectedAgencyId]);

  //TODO: à placer dans ConventionFormFields ????
  useEffect(() => {
    if (fetchedConvention) {
      reset(fetchedConvention);
    }
  }, [fetchedConvention, methods.reset]);

  return !reduxFormUiReady ? (
    <Loader />
  ) : (
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
                      conventionValues.statusJustification,
                    )
                  : t.intro.conventionCreationNotification
              }
            />

            <p className={fr.cx("fr-text--xs", "fr-mt-3w")}>
              Tous les champs marqués d'une astérisque (*) sont obligatoires.
            </p>

            <form
              id={domElementIds.conventionImmersionRoute.form({ mode })}
              data-matomo-name={domElementIds.conventionImmersionRoute.form({
                mode,
              })}
            >
              <>
                <>
                  <input
                    type="hidden"
                    {...formContents[
                      "signatories.beneficiary.federatedIdentity"
                    ]}
                  />
                  <div className={fr.cx("fr-accordions-group")}>
                    {route.name !== "conventionCustomAgency" && (
                      <Accordion
                        label={
                          <RenderSectionTitle
                            title={t.agencySection.title}
                            step={1}
                            currentStep={currentStep}
                            stepsStatus={stepsStatus}
                          />
                        }
                        {...makeAccordionProps(1)}
                      >
                        <AgencySelector
                          fields={{
                            agencyDepartmentField,
                            agencyIdField,
                            agencyKindField,
                          }}
                          shouldLockToPeAgencies={shouldLockToPeAgencies}
                          shouldFilterDelegationPrescriptionAgencyKind={false}
                          shouldShowAgencyKindField={
                            conventionValues?.internshipKind === "immersion"
                          }
                          agencyDepartmentOptions={departmentOptions}
                          onDepartmentCodeChangedMemoized={
                            onDepartmentCodeChangedMemoized
                          }
                          agencyOptions={agencyOptions}
                          isLoading={isAgenciesLoading}
                          isFetchAgencyOptionsError={
                            agenciesFeedback.kind === "errored"
                          }
                        />
                      </Accordion>
                    )}

                    <Accordion
                      label={
                        <RenderSectionTitle
                          title={t.beneficiarySection.title}
                          step={2}
                          currentStep={currentStep}
                          stepsStatus={stepsStatus}
                        />
                      }
                      {...makeAccordionProps(2)}
                    >
                      <BeneficiaryFormSection
                        internshipKind={conventionValues.internshipKind}
                        emailValidationErrors={emailValidationErrors}
                        setEmailValidationErrors={setEmailValidationErrors}
                        fromPeConnectedUser={route.params.fromPeConnectedUser}
                      />
                    </Accordion>
                    <Accordion
                      label={
                        <RenderSectionTitle
                          title={t.establishmentSection.title}
                          step={3}
                          currentStep={currentStep}
                          stepsStatus={stepsStatus}
                        />
                      }
                      {...makeAccordionProps(3)}
                    >
                      <EstablishmentFormSection
                        emailValidationErrors={emailValidationErrors}
                        setEmailValidationErrors={setEmailValidationErrors}
                      />
                    </Accordion>
                    <Accordion
                      label={
                        <RenderSectionTitle
                          title={t.immersionHourLocationSection.title}
                          step={4}
                          currentStep={currentStep}
                          stepsStatus={stepsStatus}
                        />
                      }
                      {...makeAccordionProps(4)}
                    >
                      <ScheduleSection />
                      <AddressAutocomplete
                        {...formContents.immersionAddress}
                        initialSearchTerm={
                          conventionValues.immersionAddress ??
                          establishmentInfos?.businessAddress
                        }
                        setFormValue={({ address }) =>
                          setValue(
                            "immersionAddress",
                            addressDtoToString(address),
                          )
                        }
                        disabled={isFetchingSiret}
                        {...getFieldError("immersionAddress")}
                      />
                    </Accordion>
                    <Accordion
                      label={
                        <RenderSectionTitle
                          title={t.immersionDetailsSection.title}
                          step={5}
                          currentStep={currentStep}
                          stepsStatus={stepsStatus}
                        />
                      }
                      {...makeAccordionProps(5)}
                    >
                      <ImmersionDetailsSection />
                    </Accordion>
                  </div>

                  <Alert
                    small
                    severity="warning"
                    className={fr.cx("fr-my-2w")}
                    description={
                      <ol>
                        <li>
                          Une fois le formulaire envoyé, chaque signataire de la
                          convention va recevoir un email.
                        </li>
                        <li>
                          Pensez à vérifier votre boîte email et votre dossier
                          de spams.
                        </li>
                        <li>
                          Pensez également à informer les autres signataires de
                          la convention qu'ils devront vérifier leur boîte email
                          et leur dossier de spams.
                        </li>
                      </ol>
                    }
                  />
                  <ErrorNotifications
                    labels={getFormErrors()}
                    errors={displayReadableError(errors)}
                    visible={
                      submitCount !== 0 && Object.values(errors).length > 0
                    }
                  />
                  {keys(emailValidationErrors).length > 0 && (
                    <Alert
                      severity="error"
                      className={fr.cx("fr-my-2w")}
                      title="Certains emails ne sont pas valides"
                      description={
                        <>
                          <p>
                            Notre vérificateur d'email a détecté des emails non
                            valides dans votre convention.
                          </p>
                          <ul>
                            {keys(emailValidationErrors).map((key) => (
                              <li>
                                {key} : {emailValidationErrors[key]}
                              </li>
                            ))}
                          </ul>
                        </>
                      }
                    />
                  )}
                </>
              </>
              <div className={fr.cx("fr-mt-4w", "fr-hidden", "fr-unhidden-lg")}>
                <Button
                  disabled={shouldSubmitButtonBeDisabled}
                  iconId="fr-icon-checkbox-circle-line"
                  iconPosition="left"
                  type="button"
                  nativeButtonProps={{
                    id: domElementIds.conventionImmersionRoute.submitFormButton,
                  }}
                  onClick={(e) =>
                    handleSubmit(onSubmit, (errors) => {
                      validateSteps("doNotClear");
                      console.error(conventionValues, errors);
                    })(e)
                  }
                >
                  Vérifier la demande
                </Button>
              </div>
              <ConventionFeedbackNotification
                submitFeedback={submitFeedback}
                signatories={conventionValues.signatories}
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
                  onClick={(e) =>
                    handleSubmit(onSubmit, (errors) => {
                      validateSteps("doNotClear");
                      console.error(conventionValues, errors);
                    })(e)
                  }
                  id={
                    domElementIds.conventionImmersionRoute
                      .submitFormButtonMobile
                  }
                >
                  Vérifier la demande
                </Button>
              </div>
            }
          />
        }
      />
    </FormProvider>
  );
};

const makeListAgencyOptionsKindFilter = ({
  internshipKind,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): AgencyKindFilter => {
  if (internshipKind === "mini-stage-cci") return "miniStageOnly";
  if (shouldListAll) return "miniStageExcluded";
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? "immersionPeOnly"
    : "miniStageExcluded";
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

const RenderSectionTitle = ({
  title,
  step,
  stepsStatus,
  currentStep,
}: {
  title: string;
  step: number;
  stepsStatus: Record<number, StepSeverity> | null;
  currentStep: NumberOfSteps;
}) => {
  const badgeData: Record<
    StepSeverity,
    {
      severity: StepSeverity;
      label: string;
    }
  > = {
    error: { severity: "error", label: "Erreur" },
    success: { severity: "success", label: "Complet" },
    info: { severity: "info", label: "À compléter" },
  };

  const { label, severity } = badgeData[stepsStatus?.[step] ?? "info"];

  return (
    <>
      {currentStep === step ? <strong>{title}</strong> : title}
      <Badge severity={severity} className={fr.cx("fr-ml-2w")}>
        {label}
      </Badge>
    </>
  );
};
