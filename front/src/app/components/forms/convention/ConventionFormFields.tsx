import React, { useEffect, useMemo, useRef, useState } from "react";
import { get, type SubmitHandler, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import {
  addressDtoToString,
  AgencyOption,
  ConventionReadDto,
  DepartmentCode,
  domElementIds,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
  miniStageRestrictedDepartments,
  toDotNotation,
} from "shared";
import { ErrorNotifications } from "react-design-system";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import {
  formConventionFieldsLabels,
  formUiSections,
} from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  formErrorsToFlatErrors,
  getFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useRoute } from "src/app/routes/routes";
import { agencyGateway, deviceRepository } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  NumberOfSteps,
} from "src/core-logic/domain/convention/convention.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { AddressAutocomplete } from "../autocomplete/AddressAutocomplete";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionDetailsSection } from "./sections/immersion-details/ImmersionDetailsSection";
import { ScheduleSection } from "./sections/schedule/ScheduleSection";
import { ConventionFormMode } from "./ConventionForm";

type ConventionFieldsProps = {
  onSubmit: SubmitHandler<ConventionReadDto>;
  mode: ConventionFormMode;
};

type StepSeverity = "error" | "success" | "info";

export const ConventionFormFields = ({
  onSubmit,
  mode,
}: ConventionFieldsProps): JSX.Element => {
  const {
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, submitCount, isSubmitted },
    trigger,
    clearErrors,
    getFieldState,
  } = useFormContext<ConventionReadDto>();
  const currentStep = useAppSelector(conventionSelectors.currentStep);
  const conventionValues = getValues();
  const { enablePeConnectApi } = useFeatureFlags();
  const { getFormFields, getFormErrors } = getFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const conventionSubmitFeedback = useAppSelector(conventionSelectors.feedback);
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const accordionsRef = useRef<Array<HTMLDivElement | null>>([]);
  const route = useRoute();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const [stepsStatus, setStepsStatus] = useState<Record<
    number,
    StepSeverity
  > | null>(null);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);

  const {
    agencyId: agencyIdField,
    agencyDepartment: agencyDepartmentField,
    agencyKind: agencyKindField,
  } = getFormFields();

  useEffect(() => {
    deviceRepository.delete("partialConventionInUrl");
    dispatch(conventionSlice.actions.setCurrentStep(1));
  }, []);

  useEffect(() => {
    if (mode === "edit") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      validateSteps();
    }
  }, [conventionValues.id]);

  useEffect(() => {
    if (route.name === "conventionCustomAgency" && preselectedAgencyId) {
      setValue("agencyId", preselectedAgencyId);
    }
  }, [preselectedAgencyId]);

  const dispatch = useDispatch();
  const formContents = getFormFields();
  const t = useConventionTexts(conventionValues.internshipKind);
  const shouldSubmitButtonBeDisabled =
    isLoading ||
    (isSubmitted && conventionSubmitFeedback.kind === "justSubmitted");

  const makeAccordionProps = (step: NumberOfSteps) => ({
    ref: (element: HTMLDivElement) =>
      (accordionsRef.current[step - 1] = element),
    onExpandedChange: async () => {
      await validateSteps();
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
  const getBadgeData = (
    step: number,
  ): {
    severity: StepSeverity;
    label: string;
  } => {
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
    return stepsStatus && stepsStatus[step]
      ? badgeData[stepsStatus[step]]
      : badgeData.info;
  };

  const renderStatusBadge = (step: number) => (
    <Badge severity={getBadgeData(step).severity} className={fr.cx("fr-ml-2w")}>
      {getBadgeData(step).label}
    </Badge>
  );

  const renderSectionTitle = (title: string, step: number) => {
    const baseText = currentStep === step ? <strong>{title}</strong> : title;
    return (
      <>
        {baseText}
        {renderStatusBadge(step)}
      </>
    );
  };

  const validateSteps = async (shouldClearError = true) => {
    const stepsDataValue = await Promise.all(
      formUiSections.map((_, step) => getStepData(step + 1)),
    );
    setStepsStatus(stepsDataValue.reduce((acc, curr) => ({ ...acc, ...curr })));
    if (shouldClearError) {
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
  const shouldLockToPeAgencies = !!(
    route.name === "conventionImmersion" &&
    route.params.jwt &&
    isPeConnectIdentity(
      conventionValues?.signatories.beneficiary.federatedIdentity,
    )
  );

  const shouldListAllAgencies = !enablePeConnectApi.isActive;

  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

  const agenciesRetrieverMemoized = useMemo(
    () =>
      conventionAgenciesRetriever({
        internshipKind: conventionValues.internshipKind,
        shouldListAll: shouldListAllAgencies,
        federatedIdentity,
      }),
    [conventionValues.internshipKind, shouldListAllAgencies, federatedIdentity],
  );

  return (
    <>
      <input
        type="hidden"
        {...formContents["signatories.beneficiary.federatedIdentity"]}
      />
      <div className={fr.cx("fr-accordions-group")}>
        {route.name !== "conventionCustomAgency" && (
          <Accordion
            label={renderSectionTitle(t.agencySection.title, 1)}
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
              agencyDepartmentOptions={
                conventionValues?.internshipKind === "immersion"
                  ? departmentOptions
                  : departmentOptions.filter((department) =>
                      miniStageRestrictedDepartments.includes(department.value),
                    )
              }
              agenciesRetriever={agenciesRetrieverMemoized}
            />
          </Accordion>
        )}

        <Accordion
          label={renderSectionTitle(t.beneficiarySection.title, 2)}
          {...makeAccordionProps(2)}
        >
          <BeneficiaryFormSection
            internshipKind={conventionValues.internshipKind}
          />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.establishmentSection.title, 3)}
          {...makeAccordionProps(3)}
        >
          <EstablishmentFormSection />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.immersionHourLocationSection.title, 4)}
          {...makeAccordionProps(4)}
        >
          <ScheduleSection />
          <AddressAutocomplete
            {...formContents["immersionAddress"]}
            initialSearchTerm={
              conventionValues.immersionAddress ??
              establishmentInfos?.businessAddress
            }
            setFormValue={({ address }) =>
              setValue("immersionAddress", addressDtoToString(address))
            }
            disabled={isFetchingSiret}
          />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.immersionDetailsSection.title, 5)}
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
              Une fois le formulaire envoyé, chaque signataire de la convention
              va recevoir un email.
            </li>
            <li>
              Pensez à vérifier votre boîte email et votre dossier de spams.
            </li>
            <li>
              Pensez également à informer les autres signataires de la
              convention qu'ils devront vérifier leur boîte email et leur
              dossier de spams.
            </li>
          </ol>
        }
      />
      <ErrorNotifications
        labels={getFormErrors()}
        errors={toDotNotation(formErrorsToFlatErrors(errors))}
        visible={submitCount !== 0 && Object.values(errors).length > 0}
      />

      <div className={fr.cx("fr-mt-4w")}>
        <Button
          disabled={shouldSubmitButtonBeDisabled}
          iconId="fr-icon-checkbox-circle-line"
          iconPosition="left"
          type="button"
          nativeButtonProps={{
            id: domElementIds.conventionImmersionRoute.submitFormButton,
          }}
          onClick={handleSubmit(onSubmit, (errors) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            validateSteps(false);
            // eslint-disable-next-line no-console
            console.error(getValues(), errors);
          })}
        >
          Vérifier la demande
        </Button>
      </div>
    </>
  );
};

const conventionAgenciesRetriever = ({
  internshipKind,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): ((departmentCode: DepartmentCode) => Promise<AgencyOption[]>) => {
  if (internshipKind === "mini-stage-cci")
    return (departmentCode) =>
      agencyGateway.listMiniStageAgencies(departmentCode);
  if (shouldListAll)
    return (departmentCode) =>
      agencyGateway.listImmersionAgencies(departmentCode);
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? (departmentCode) =>
        agencyGateway.listImmersionOnlyPeAgencies(departmentCode)
    : (departmentCode) => agencyGateway.listImmersionAgencies(departmentCode);
};
