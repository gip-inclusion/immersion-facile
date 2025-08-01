import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Dispatch,
  type ElementRef,
  type ReactNode,
  type SetStateAction,
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
import {
  FormProvider,
  get,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  addressDtoToString,
  type Beneficiary,
  type ConventionReadDto,
  conventionSchema,
  type DepartmentCode,
  domElementIds,
  type ExcludeFromExisting,
  errors as errorMessage,
  hasBeneficiaryCurrentEmployer,
  type InternshipKind,
  isBeneficiaryMinor,
  isBeneficiaryStudent,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isFtConnectIdentity,
  keys,
  makeListAgencyOptionsKindFilter,
  notJobSeeker,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import {
  type ConventionFormMode,
  creationFormModes,
  type SupportedConventionRoutes,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import {
  type ConventionPresentation,
  conventionPresentationSchema,
  undefinedIfEmptyString,
} from "src/app/components/forms/convention/conventionHelpers";
import { BeneficiaryFormSection } from "src/app/components/forms/convention/sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "src/app/components/forms/convention/sections/establishment/EstablishmentFormSection";
import { ImmersionDetailsSection } from "src/app/components/forms/convention/sections/immersion-details/ImmersionDetailsSection";
import { ScheduleSection } from "src/app/components/forms/convention/sections/schedule/ScheduleSection";
import { useUpdateConventionValuesInUrl } from "src/app/components/forms/convention/useUpdateConventionValuesInUrl";
import {
  formConventionFieldsLabels,
  formUiSections,
  sidebarStepContent,
} from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
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
import { appellationSlice } from "src/core-logic/domain/appellation/appellation.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  type NumberOfSteps,
} from "src/core-logic/domain/convention/convention.slice";
import { geocodingSlice } from "src/core-logic/domain/geocoding/geocoding.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
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
    ReactNode
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
  const isLoading = useAppSelector(conventionSelectors.isLoading);

  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const establishmentNumberEmployeesRange = useAppSelector(
    siretSelectors.establishmentInfos,
  )?.numberEmployeesRange;

  const agencyOptions = useSelector(agenciesSelectors.options);
  const agenciesFeedback = useSelector(agenciesSelectors.feedback);
  const isAgenciesLoading = useSelector(agenciesSelectors.isLoading);
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const establishmentAddressCountryCode = useAppSelector(
    siretSelectors.countryCode,
  );
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
    ...(federatedIdentity?.payload && mode === "create-from-scratch"
      ? {
          agencyReferentFirstName: federatedIdentity.payload.advisor.firstName,
          agencyReferentLastName: federatedIdentity.payload.advisor.lastName,
        }
      : {}),
  }).current;
  useExistingSiret({
    siret: initialValues.siret,
    addressAutocompleteLocator: "convention-immersion-address",
  });

  const reduxFormUiReady = useWaitForReduxFormUiReadyBeforeInitialisation(
    initialValues,
    mode,
  );
  const defaultValues = creationFormModes.includes(
    mode as ExcludeFromExisting<ConventionFormMode, "edit">,
  )
    ? initialValues
    : fetchedConvention || initialValues;

  const methods = useForm<Required<ConventionPresentation>>({
    defaultValues,
    resolver: zodResolver(conventionPresentationSchema),
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
    register,
    reset,
  } = methods;

  const { errors, submitCount } = formState;

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

  const onSubmit: SubmitHandler<Required<ConventionPresentation>> = (
    convention,
  ) => {
    const selectedAgency = agencyOptions.find(
      (agencyOption) => agencyOption.id === convention.agencyId,
    );
    if (!selectedAgency)
      throw errorMessage.agency.notFound({ agencyId: convention.agencyId });
    const conventionToSave: ConventionReadDto = {
      ...conventionSchema.parse(convention),
      agencyKind: convention.agencyKind,
      agencyDepartment: convention.agencyDepartment,
      workConditions: undefinedIfEmptyString(convention.workConditions),
      agencyReferent: {
        firstname: undefinedIfEmptyString(convention.agencyReferent?.firstname),
        lastname: undefinedIfEmptyString(convention.agencyReferent?.lastname),
      },
      establishmentNumberEmployeesRange:
        establishmentNumberEmployeesRange === ""
          ? undefined
          : establishmentNumberEmployeesRange,
      agencySiret: "",
      agencyName: selectedAgency.name,
      agencyCounsellorEmails: [],
      agencyValidatorEmails: [],
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
    isLoading || keys(emailValidationErrors).length > 0;

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
    isFtConnectIdentity(
      conventionValues?.signatories.beneficiary.federatedIdentity,
    )
  );

  const conventionIsLoading = isLoading || !reduxFormUiReady;

  const validateSteps = async (type: "clearAllErrors" | "doNotClear") => {
    const stepsDataValue = await Promise.all(
      formUiSections.map((_, step) => getStepData(step + 1)),
    );
    setStepsStatus(stepsDataValue.reduce((acc, curr) => ({ ...acc, ...curr })));
    if (type === "clearAllErrors") {
      // biome-ignore lint/suspicious/noConsole: debug purpose
      console.info("CLEAR ALL ERRORS");
      clearErrors();
    }
  };

  const getStepData = async (
    step: number,
  ): Promise<Record<number, StepSeverity>> => {
    const stepFields = formUiSections[step - 1];
    const validatedFields = stepFields.map(async (field) => ({
      [field]: await trigger(field as keyof ConventionPresentation),
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
          getFieldState(stepField as keyof ConventionPresentation).isTouched,
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
  }, [dispatch]);

  useEffect(() => {
    if (mode === "edit") {
      validateSteps("clearAllErrors");
    }
  }, [conventionValues.id]);

  //TODO: à placer dans ConventionFormFields ????
  useEffect(() => {
    if (fetchedConvention && mode === "edit") {
      reset({ ...fetchedConvention, status: "READY_TO_SIGN" });
    }
  }, [fetchedConvention, reset, mode]);

  useEffect(() => {
    if (defaultValues.siret) {
      dispatch(
        siretSlice.actions.siretModified({
          siret: defaultValues.siret,
          addressAutocompleteLocator: "convention-immersion-address",
          feedbackTopic: "siret-input",
        }),
      );
    }

    if (defaultValues.immersionAppellation) {
      dispatch(
        appellationSlice.actions.selectSuggestionRequested({
          item: {
            appellation: {
              appellationCode:
                defaultValues.immersionAppellation.appellationCode,
              appellationLabel:
                defaultValues.immersionAppellation.appellationLabel,
              romeCode: defaultValues.immersionAppellation.romeCode,
              romeLabel: defaultValues.immersionAppellation.romeLabel,
            },
            matchRanges: [],
          },
          locator: "convention-profession",
        }),
      );
    }

    if (defaultValues.signatories.beneficiaryCurrentEmployer) {
      dispatch(
        geocodingSlice.actions.fetchSuggestionsRequested({
          lookup:
            defaultValues.signatories.beneficiaryCurrentEmployer
              .businessAddress,
          selectFirstSuggestion: true,
          countryCode: "FR",
          locator: "convention-beneficiary-current-employer-address",
        }),
      );
    }

    if (
      defaultValues.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(defaultValues.signatories.beneficiary) &&
      defaultValues.signatories.beneficiary.address
    ) {
      dispatch(
        geocodingSlice.actions.selectSuggestionRequested({
          item: {
            address: defaultValues.signatories.beneficiary.address,
            position: { lat: 0, lon: 0 },
          },
          locator: "convention-beneficiary-address",
        }),
      );
    }
  }, [defaultValues, dispatch]);
  return (
    <FormProvider {...methods}>
      {conventionIsLoading && <Loader />}
      <ConventionFormLayout
        form={
          <>
            <div className={cx("fr-text")}>{t.intro.welcome}</div>
            {mode !== "edit" && (
              <Alert
                severity="info"
                small
                description={t.intro.conventionCreationNotification}
              />
            )}

            <p className={fr.cx("fr-text--xs", "fr-mt-3w")}>
              Tous les champs marqués d'une astérisque (*) sont obligatoires.
            </p>

            <form
              id={domElementIds.conventionImmersionRoute.form({
                mode,
                internshipKind,
              })}
              data-matomo-name={domElementIds.conventionImmersionRoute.form({
                mode,
                internshipKind,
              })}
            >
              <input
                type="hidden"
                {...formContents["signatories.beneficiary.federatedIdentity"]}
              />
              <div className={fr.cx("fr-accordions-group")}>
                <Accordion
                  label={
                    <SectionTitle
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
                  <Input
                    label={formContents["agencyReferent.firstname"].label}
                    hintText={formContents["agencyReferent.firstname"].hintText}
                    nativeInputProps={{
                      ...formContents["agencyReferent.firstname"],
                      ...register("agencyReferent.firstname"),
                    }}
                    {...getFieldError("agencyReferent.firstname")}
                  />
                  <Input
                    label={formContents["agencyReferent.lastname"].label}
                    hintText={formContents["agencyReferent.lastname"].hintText}
                    nativeInputProps={{
                      ...formContents["agencyReferent.lastname"],
                      ...register("agencyReferent.lastname"),
                    }}
                    {...getFieldError("agencyReferent.lastname")}
                  />
                </Accordion>

                <Accordion
                  label={
                    <SectionTitle
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
                    <SectionTitle
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
                    <SectionTitle
                      title={t.immersionHourLocationSection.title}
                      step={4}
                      currentStep={currentStep}
                      stepsStatus={stepsStatus}
                    />
                  }
                  {...makeAccordionProps(4)}
                >
                  <AddressAutocomplete
                    {...formContents.immersionAddress}
                    withCountrySelect={true}
                    countryCode={establishmentAddressCountryCode ?? undefined}
                    selectProps={{
                      inputId:
                        domElementIds.conventionImmersionRoute.conventionSection
                          .immersionAddress,
                    }}
                    locator="convention-immersion-address"
                    onAddressSelected={(addressAndPosition) => {
                      setValue(
                        "immersionAddress",
                        addressDtoToString(addressAndPosition.address),
                      );
                    }}
                    onAddressClear={() => {
                      setValue("immersionAddress", "");
                    }}
                    disabled={isFetchingSiret}
                    {...getFieldError("immersionAddress")}
                  />
                  <ScheduleSection />
                </Accordion>
                <Accordion
                  label={
                    <SectionTitle
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

              <ErrorNotifications
                errorsWithLabels={toErrorsWithLabels({
                  errors: displayReadableError(errors),
                  labels: getFormErrors(),
                })}
                visible={submitCount !== 0 && Object.values(errors).length > 0}
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
                          <li key={key}>
                            {key} : {emailValidationErrors[key]}
                          </li>
                        ))}
                      </ul>
                    </>
                  }
                />
              )}

              <div className={fr.cx("fr-mt-4w", "fr-hidden", "fr-unhidden-lg")}>
                <Button
                  disabled={shouldSubmitButtonBeDisabled}
                  iconId="fr-icon-checkbox-circle-line"
                  iconPosition="left"
                  type="button"
                  nativeButtonProps={{
                    id: domElementIds.conventionImmersionRoute.submitFormButton,
                  }}
                  onClick={handleSubmit(onSubmit, (errors) => {
                    validateSteps("doNotClear");
                    // biome-ignore lint/suspicious/noConsole: debug purpose
                    console.error(conventionValues, errors);
                  })}
                >
                  Vérifier la demande
                </Button>
              </div>
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
                  type="button"
                  id={
                    domElementIds.conventionImmersionRoute
                      .submitFormButtonMobile
                  }
                  onClick={handleSubmit(onSubmit, (errors) => {
                    validateSteps("doNotClear");
                    // biome-ignore lint/suspicious/noConsole: debug purpose
                    console.error(conventionValues, errors);
                  })}
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

const makeInitialBenefiaryForm = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
  federatedIdentityWithUser: FederatedIdentityWithUser | null,
): Beneficiary<"immersion" | "mini-stage-cci"> => {
  const { federatedIdentity, ...beneficiaryOtherProperties } = beneficiary;
  const peConnectIdentity =
    federatedIdentityWithUser && isFtConnectIdentity(federatedIdentityWithUser)
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
  mode: ConventionFormMode,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(
        isBeneficiaryMinor({
          beneficiaryRepresentative:
            initialValues.signatories.beneficiaryRepresentative,
          beneficiaryBirthdate: initialValues.signatories.beneficiary.birthdate,
          conventionDateStart: initialValues.dateStart,
        }),
      ),
    );
    dispatch(
      conventionSlice.actions.isCurrentEmployerChanged(
        hasBeneficiaryCurrentEmployer(initialValues),
      ),
    );
    if (mode !== "edit") {
      dispatch(
        conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
          isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
        ),
      );
    }
    setReduxFormUiReady(true);
  }, [dispatch, initialValues, mode]);

  return reduxFormUiReady;
};

const SectionTitle = ({
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
