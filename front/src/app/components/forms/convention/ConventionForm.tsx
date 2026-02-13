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
  useMemo,
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
  type AgencyOption,
  addressDtoToString,
  type Beneficiary,
  type ConventionDraftId,
  type ConventionFormInitialValues,
  type ConventionId,
  type ConventionPresentation,
  type ConventionReadDto,
  type ConventionTemplate,
  type ConventionTemplateId,
  type CreateConventionPresentationInitialValues,
  conventionSchema,
  type DepartmentCode,
  defaultCountryCode,
  domElementIds,
  type ExcludeFromExisting,
  errors as errorMessage,
  type InternshipKind,
  isBeneficiaryMinor,
  isCreateConventionPresentationInitialValues,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isFtConnectIdentity,
  keys,
  makeConventionPresentationSchemaWithNormalizedInput,
  makeListAgencyOptionsKindFilter,
  replaceEmptyValuesByUndefinedFromObject,
  toConventionTemplate,
  undefinedIfEmptyString,
} from "shared";
import { AddressAutocompleteWithCountrySelect } from "src/app/components/forms/autocomplete/AddressAutocompleteWithCountrySelect";
import {
  AgencySelector,
  departmentOptions,
  isAllAgencyKinds,
} from "src/app/components/forms/commons/AgencySelector";
import {
  type ConventionFormMode,
  creationFormModes,
  type SupportedConventionRoutes,
} from "src/app/components/forms/convention/ConventionFormWrapper";
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
import {
  conventionPresentationFromConventionDraft,
  getConventionInitialValuesFromUrl,
  makeConventionPresentationFromConventionTemplate,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { useRoute } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { appellationSlice } from "src/core-logic/domain/appellation/appellation.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  type NumberOfSteps,
} from "src/core-logic/domain/convention/convention.slice";
import { conventionDraftSelectors } from "src/core-logic/domain/convention/convention-draft/conventionDraft.selectors";
import { conventionTemplateSelectors } from "src/core-logic/domain/convention-template/conventionTemplate.selectors";
import { conventionTemplateSlice } from "src/core-logic/domain/convention-template/conventionTemplate.slice";
import { geocodingSlice } from "src/core-logic/domain/geocoding/geocoding.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { useStyles } from "tss-react/dsfr";
import { ShareConventionDraft } from "./ShareConventionDraft";

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
  fromConventionTemplateId,
}: {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
  fromConventionTemplateId?: ConventionTemplateId;
}) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const route = useRoute() as SupportedConventionRoutes;

  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const fetchedConventionDraft = useAppSelector(
    conventionDraftSelectors.conventionDraft,
  );
  const fetchedConventionTemplate = useAppSelector(
    conventionTemplateSelectors.getConventionTemplateById(
      fromConventionTemplateId,
    ),
  );
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

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
  const conventionInitialValuesFromUrl = useMemo(
    () =>
      getConventionInitialValuesFromUrl({
        route,
        internshipKind,
      }),
    [internshipKind, route],
  );
  const acquisitionParams = useGetAcquisitionParams();

  const initialValues = useRef<CreateConventionPresentationInitialValues>({
    ...conventionInitialValuesFromUrl,
    ...acquisitionParams,
    signatories: {
      ...conventionInitialValuesFromUrl.signatories,
      beneficiary: makeInitialBenefiaryForm(
        conventionInitialValuesFromUrl.signatories.beneficiary,
        federatedIdentity,
      ),
    },
    ...(federatedIdentity?.payload?.advisor &&
    mode === "create-convention-from-scratch"
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

  const conventionPresentationFromDraft = useMemo(
    () =>
      fetchedConventionDraft &&
      conventionPresentationFromConventionDraft(fetchedConventionDraft),
    [fetchedConventionDraft],
  );

  const conventionPresentationFromConventionTemplate = useMemo(
    () =>
      fetchedConventionTemplate &&
      makeConventionPresentationFromConventionTemplate(
        fetchedConventionTemplate,
      ),
    [fetchedConventionTemplate],
  );

  const isTemplateForm =
    ["create-convention-template", "edit-convention-template"].includes(mode) &&
    !!connectedUserJwt &&
    !!currentUser;
  const shouldShowShareConventionDraftButton =
    mode !== "edit-convention" && !isTemplateForm;

  const makeDefaultValues = ({ mode }: { mode: ConventionFormMode }) => {
    const isCreationMode = creationFormModes.includes(
      mode as ExcludeFromExisting<
        ConventionFormMode,
        "edit-convention" | "edit-convention-template"
      >,
    );
    if (isCreationMode) {
      if (isTemplateForm) {
        return replaceEmptyValuesByUndefinedFromObject(initialValues);
      }
      return initialValues;
    }
    return (
      fetchedConvention ||
      conventionPresentationFromDraft ||
      conventionPresentationFromConventionTemplate ||
      initialValues
    );
  };
  const defaultValues: ConventionFormInitialValues = makeDefaultValues({
    mode,
  });

  const presentationSchema = useMemo(
    () =>
      makeConventionPresentationSchemaWithNormalizedInput({ isTemplateForm }),
    [isTemplateForm],
  );

  const methods = useForm<ConventionFormInitialValues>({
    defaultValues,
    values: defaultValues,
    resolver: zodResolver(presentationSchema),
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
    makeValuesToWatchInUrl(
      isCreateConventionPresentationInitialValues(conventionValues)
        ? {
            ...conventionValues,
            fromPeConnectedUser: route.params.fromPeConnectedUser,
          }
        : {
            ...initialValues,
            fromPeConnectedUser: route.params.fromPeConnectedUser,
          },
    ),
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

  const saveConvention = (
    convention: ConventionFormInitialValues,
    selectedAgency: AgencyOption | undefined,
  ) => {
    if (!selectedAgency || !convention.agencyId) {
      throw errorMessage.agency.notFound({
        agencyId: convention.agencyId ?? "",
      });
    }
    const conventionToSave: ConventionReadDto = {
      ...conventionSchema.parse(convention),
      agencyDepartment: convention.agencyDepartment ?? "",
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
      agencyKind: selectedAgency.kind,
      agencyName: selectedAgency.name,
      agencyContactEmail: "",
      agencyCounsellorEmails: [],
      agencyValidatorEmails: [],
      assessment: null,
    };
    dispatch(
      conventionSlice.actions.showSummaryChangeRequested({
        showSummary: true,
        convention: conventionToSave,
        fromConventionDraftId: conventionValues.fromConventionDraftId,
      }),
    );
  };

  const saveConventionTemplate = (
    convention: ConventionFormInitialValues,
    selectedAgency: AgencyOption | undefined,
  ) => {
    if (!selectedAgency && convention.agencyId) {
      throw errorMessage.agency.notFound({
        agencyId: convention.agencyId ?? "",
      });
    }
    if (!connectedUserJwt || !currentUser) {
      throw errorMessage.user.unauthorized();
    }
    if (isCreateConventionPresentationInitialValues(convention)) {
      throw errorMessage.conventionTemplate.forbiddenMissingName();
    }
    const conventionToSave: ConventionTemplate = toConventionTemplate({
      convention,
      userId: currentUser.id,
      establishmentNumberEmployeesRange,
      selectedAgencyKind: selectedAgency?.kind,
      fromConventionTemplateId,
    });

    dispatch(
      conventionTemplateSlice.actions.createOrUpdateConventionTemplateRequested(
        {
          conventionTemplate: conventionToSave,
          jwt: connectedUserJwt,
          feedbackTopic: "convention-template",
        },
      ),
    );
  };

  const onSubmit: SubmitHandler<ConventionFormInitialValues> = (convention) => {
    const selectedAgency = agencyOptions.find(
      (agencyOption) => agencyOption.id === convention.agencyId,
    );
    if (!isTemplateForm) {
      saveConvention(convention, selectedAgency);
      return;
    }

    saveConventionTemplate(convention, selectedAgency);
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

  const prevFetchedConventionIdRef = useRef<ConventionId | undefined>(
    undefined,
  );
  const prevConventionDraftIdRef = useRef<ConventionDraftId | undefined>(
    undefined,
  );
  const prevConventionTemplateIdRef = useRef<ConventionTemplateId | undefined>(
    undefined,
  );

  const submitButtonLabel = useMemo(() => {
    if (isTemplateForm) {
      return mode === "create-convention-template"
        ? "Créer un modèle de convention"
        : "Modifier le modèle de convention";
    }
    return "Vérifier la demande";
  }, [isTemplateForm, mode]);

  if (
    fetchedConvention &&
    fetchedConvention.id !== prevFetchedConventionIdRef.current
  ) {
    prevFetchedConventionIdRef.current = fetchedConvention.id;
    reset({ ...fetchedConvention, status: "READY_TO_SIGN" });
  }

  if (
    conventionPresentationFromDraft &&
    conventionPresentationFromDraft.fromConventionDraftId !==
      prevConventionDraftIdRef.current
  ) {
    prevConventionDraftIdRef.current =
      conventionPresentationFromDraft.fromConventionDraftId;
    reset({ ...conventionPresentationFromDraft, status: "READY_TO_SIGN" });
  }

  if (
    conventionPresentationFromConventionTemplate &&
    conventionPresentationFromConventionTemplate.id !==
      prevConventionTemplateIdRef.current
  ) {
    prevConventionTemplateIdRef.current =
      conventionPresentationFromConventionTemplate.id;
    reset({
      ...conventionPresentationFromConventionTemplate,
      status: "READY_TO_SIGN",
    });
  }

  useEffect(() => {
    outOfReduxDependencies.localDeviceRepository.delete(
      "partialConventionInUrl",
    );
    outOfReduxDependencies.localDeviceRepository.delete("conventionDraftId");
    dispatch(conventionSlice.actions.setCurrentStep(1));
  }, [dispatch]);

  useEffect(() => {
    if (mode === "edit-convention") {
      validateSteps("clearAllErrors");
    }
  }, [conventionValues.id]);

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

    if (
      defaultValues.immersionAppellation?.appellationCode &&
      defaultValues.immersionAppellation?.appellationLabel &&
      defaultValues.immersionAppellation?.romeCode &&
      defaultValues.immersionAppellation?.romeLabel
    ) {
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

    if (
      defaultValues.signatories?.beneficiaryCurrentEmployer?.businessAddress
    ) {
      dispatch(
        geocodingSlice.actions.fetchSuggestionsRequested({
          lookup:
            defaultValues.signatories.beneficiaryCurrentEmployer
              .businessAddress,
          selectFirstSuggestion: true,
          countryCode: defaultCountryCode,
          locator: "convention-beneficiary-current-employer-address",
        }),
      );
    }

    if (
      defaultValues.internshipKind === "mini-stage-cci" &&
      defaultValues.signatories?.beneficiary &&
      "levelOfEducation" in defaultValues.signatories.beneficiary &&
      defaultValues.signatories.beneficiary.address?.streetNumberAndAddress !=
        null &&
      defaultValues.signatories.beneficiary.address.postcode != null &&
      defaultValues.signatories.beneficiary.address.departmentCode != null &&
      defaultValues.signatories.beneficiary.address.city != null
    ) {
      dispatch(
        geocodingSlice.actions.selectSuggestionRequested({
          item: {
            address: {
              streetNumberAndAddress:
                defaultValues.signatories.beneficiary.address
                  .streetNumberAndAddress,
              postcode: defaultValues.signatories.beneficiary.address.postcode,
              departmentCode:
                defaultValues.signatories.beneficiary.address.departmentCode,
              city: defaultValues.signatories.beneficiary.address.city,
              countryCode: establishmentAddressCountryCode ?? "FR",
            },
            position: { lat: 0, lon: 0 },
          },
          locator: "convention-beneficiary-address",
        }),
      );
    }
  }, [defaultValues, dispatch, establishmentAddressCountryCode]);

  return (
    <>
      {conventionIsLoading && <Loader />}
      <ConventionFormLayout
        form={
          <FormProvider {...methods}>
            <div className={cx("fr-text")}>
              {t.intro.conventionFormDescription}
            </div>
            {mode !== "edit-convention" && (
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
            >
              <input
                type="hidden"
                {...formContents["signatories.beneficiary.federatedIdentity"]}
              />
              {isTemplateForm && (
                <Input
                  label="Nom du modèle *"
                  nativeInputProps={{
                    ...register("name"),
                    id: domElementIds.agencyDashboardConventionTemplate.form
                      .nameInput,
                  }}
                />
              )}
              <div className={fr.cx("fr-accordions-group")}>
                <Accordion
                  titleAs="h2"
                  label={
                    <SectionTitle
                      title={`1. ${t.agencySection.title}`}
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
                  titleAs="h2"
                  label={
                    <SectionTitle
                      title={`2. ${t.beneficiarySection.title}`}
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
                  titleAs="h2"
                  label={
                    <SectionTitle
                      title={`3. ${t.establishmentSection.title}`}
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
                  titleAs="h2"
                  label={
                    <SectionTitle
                      title={`4. ${t.immersionHourLocationSection.title}`}
                      step={4}
                      currentStep={currentStep}
                      stepsStatus={stepsStatus}
                    />
                  }
                  {...makeAccordionProps(4)}
                >
                  <AddressAutocompleteWithCountrySelect
                    {...formContents.immersionAddress}
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
                    initialInputValue={getValues("immersionAddress")}
                    {...getFieldError("immersionAddress")}
                  />
                  <ScheduleSection
                    internshipKind={conventionValues.internshipKind}
                  />
                </Accordion>
                <Accordion
                  titleAs="h2"
                  label={
                    <SectionTitle
                      title={`5. ${t.immersionDetailsSection.title}`}
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
                    id: isTemplateForm
                      ? domElementIds.agencyDashboardConventionTemplate.form
                          .submitFormButton
                      : domElementIds.conventionImmersionRoute.submitFormButton,
                  }}
                  onClick={handleSubmit(onSubmit, (errors) => {
                    validateSteps("doNotClear");
                    // biome-ignore lint/suspicious/noConsole: debug purpose
                    console.error(conventionValues, errors);
                  })}
                >
                  {submitButtonLabel}
                </Button>
              </div>
            </form>
          </FormProvider>
        }
        sidebar={
          <ConventionFormSidebar
            currentStep={currentStep}
            sidebarContent={sidebarContent}
            sidebarFooter={
              <>
                {shouldShowShareConventionDraftButton &&
                  isCreateConventionPresentationInitialValues(
                    conventionValues,
                  ) && (
                    <ShareConventionDraft
                      conventionFormData={{
                        ...conventionValues,
                        agencyKind: isAllAgencyKinds(
                          conventionValues.agencyKind,
                        )
                          ? undefined
                          : conventionValues.agencyKind,
                      }}
                    />
                  )}
                <Button
                  type="button"
                  id={
                    isTemplateForm
                      ? domElementIds.agencyDashboardConventionTemplate.form
                          .submitFormButtonMobile
                      : domElementIds.conventionImmersionRoute
                          .submitFormButtonMobile
                  }
                  onClick={handleSubmit(onSubmit, (errors) => {
                    validateSteps("doNotClear");
                    // biome-ignore lint/suspicious/noConsole: debug purpose
                    console.error(conventionValues, errors);
                  })}
                >
                  {submitButtonLabel}
                </Button>
              </>
            }
          />
        }
      />
    </>
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
    federatedIdentity: federatedIdentityValue,
  };
};

const useWaitForReduxFormUiReadyBeforeInitialisation = (
  initialValues: CreateConventionPresentationInitialValues,
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
        !!initialValues.signatories?.beneficiaryCurrentEmployer,
      ),
    );
    if (mode !== "edit-convention") {
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
