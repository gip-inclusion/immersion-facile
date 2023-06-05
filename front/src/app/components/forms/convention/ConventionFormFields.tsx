import React, { useEffect, useState } from "react";
import { get, type SubmitHandler, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import { ConventionReadDto, domElementIds, toDotNotation } from "shared";
import { ErrorNotifications } from "react-design-system";
import { makeValuesToWatchInUrl } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import {
  formConventionFieldsLabels,
  formUiSections,
} from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  formErrorsToFlatErrors,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  NumberOfSteps,
} from "src/core-logic/domain/convention/convention.slice";
import { AgencySelector } from "./sections/agency/AgencySelector";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionHourLocationSection } from "./sections/hour-location/ImmersionHourLocationSection";
import { ImmersionDetailsSection } from "./sections/immersion-details/ImmersionDetailsSection";
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
  const conventionSubmitFeedback = useAppSelector(conventionSelectors.feedback);
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const route = useRoute();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const [stepsStatus, setStepsStatus] = useState<Record<
    number,
    StepSeverity
  > | null>(null);

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

  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(conventionValues);
  useConventionWatchValuesInUrl(watchedValues);
  const { getFormFields, getFormErrors } = useFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const dispatch = useDispatch();
  const formContents = getFormFields();
  const t = useConventionTexts(conventionValues.internshipKind);
  const shouldSubmitButtonBeDisabled =
    isLoading ||
    (isSubmitted && conventionSubmitFeedback.kind === "justSubmitted");

  const makeAccordionProps = (step: NumberOfSteps) => ({
    onExpandedChange: async () => {
      await validateSteps();
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
              internshipKind={conventionValues.internshipKind}
              defaultAgencyId={conventionValues.agencyId}
              shouldListAll={!enablePeConnectApi}
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
          <ImmersionHourLocationSection />
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
          onClick={handleSubmit(
            (values) => onSubmit(values),
            (errors) => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              validateSteps(false);
              // eslint-disable-next-line no-console
              console.error(getValues(), errors);
            },
          )}
        >
          Vérifier la demande
        </Button>
      </div>
    </>
  );
};
