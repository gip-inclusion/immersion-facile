import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import Stepper, { StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { useEffect, useState } from "react";
import {
  ConventionJobAndObjective,
  ConventionTotalHours,
  Loader,
} from "react-design-system";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AssessmentDto,
  AssessmentStatus,
  ConventionDto,
  ConventionReadDto,
  DotNestedKeys,
  InternshipKind,
  assessmentSchema,
  assessmentStatuses,
  convertLocaleDateToUtcTimezoneDate,
  domElementIds,
  hoursValueToHoursDisplayed,
  toDisplayedDate,
  typeOfContracts,
} from "shared";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { ImmersionDescription } from "src/app/components/forms/assessment/ImmersionDescription";
import { printWeekSchedule } from "src/app/contents/convention/conventionSummary.helpers";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { match } from "ts-pattern";

type AssessmentFormProperties = {
  convention: ConventionReadDto;
  jwt: string;
};

export type OnStepChange = (
  // @TODO: make it generic to handle FormEstablishment and AssessmentForm
  step: Step,
  fieldsToValidate: (keyof AssessmentDto | DotNestedKeys<AssessmentDto>)[],
) => void;

type Step = 1 | 2 | 3;

const steps: Record<Step, Pick<StepperProps, "title" | "nextTitle">> = {
  1: {
    title: "Détails de l'immersion",
    nextTitle: "Résultats de l'immersion",
  },
  2: {
    title: "Résultats de l'immersion",
    nextTitle: "Commentaires et bilan",
  },
  3: {
    title: "Commentaires et bilan",
  },
};

export const AssessmentForm = ({
  convention,
  jwt,
}: AssessmentFormProperties): JSX.Element => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const isLoading = useAppSelector(assessmentSelectors.isLoading);
  const currentAssessment = useAppSelector(
    assessmentSelectors.currentAssessment,
  );
  const initialValues: AssessmentDto = {
    conventionId: convention.id,
    status: "COMPLETED",
    establishmentFeedback: "",
    establishmentAdvices: "",
    endedWithAJob: false,
  };
  const methods = useForm<AssessmentDto>({
    resolver: zodResolver(assessmentSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const { handleSubmit, trigger } = methods;

  const onSubmit = (values: AssessmentDto) => {
    dispatch(
      assessmentSlice.actions.creationRequested({
        assessmentAndJwt: {
          assessment: values,
          jwt,
        },
        feedbackTopic: "assessment",
      }),
    );
  };
  const onStepChange: OnStepChange = async (step, fieldsToValidate) => {
    if (step && currentStep && step < currentStep) {
      setCurrentStep(step);
      return;
    }
    const validatedFields = await Promise.all(
      fieldsToValidate.map(async (key) => trigger(key)),
    );
    if (validatedFields.every((validatedField) => validatedField)) {
      setCurrentStep(step);
    }
  };
  useScrollToTop(currentStep);

  useEffect(() => {
    dispatch(
      assessmentSlice.actions.getAssessmentRequested({
        conventionId: convention.id,
        jwt,
        feedbackTopic: "assessment",
      }),
    );
  }, [dispatch, convention.id, jwt]);

  return (
    <>
      {isLoading && <Loader />}
      {currentAssessment && (
        // @TODO: remove this when really use feedback slice for assessment
        <Alert
          severity="error"
          title="Erreur"
          description="Le bilan a déjà été rempli et ne peut être modifié."
        />
      )}
      {!currentAssessment && (
        <WithFeedbackReplacer
          topic="assessment"
          renderFeedback={() => (
            <AssessmentSuccessMessage
              firstName={convention.signatories.beneficiary.firstName}
              lastName={convention.signatories.beneficiary.lastName}
            />
          )}
        >
          <>
            <ImmersionDescription convention={convention} />
            <FormProvider {...methods}>
              <div className={fr.cx("fr-grid-row")}>
                <div className={fr.cx("fr-col-lg-7", "fr-col-12")}>
                  <Stepper
                    currentStep={currentStep}
                    stepCount={keys(steps).length}
                    title={steps[currentStep].title}
                    nextTitle={steps[currentStep].nextTitle}
                  />
                </div>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                id={domElementIds.assessment.form}
                data-matomo-name={domElementIds.assessment.form}
              >
                {match(currentStep)
                  .with(1, () => (
                    <AssessmentStatusSection
                      convention={convention}
                      onStepChange={onStepChange}
                    />
                  ))
                  .with(2, () => (
                    <AssessmentContractSection onStepChange={onStepChange} />
                  ))
                  .with(3, () => (
                    <AssessmentCommentsSection
                      onStepChange={onStepChange}
                      jobTitle={
                        convention.immersionAppellation.appellationLabel
                      }
                      objective={convention.immersionObjective}
                    />
                  ))
                  .exhaustive()}
              </form>
            </FormProvider>
          </>
        </WithFeedbackReplacer>
      )}
    </>
  );
};

const wordingByInternshipKind: Record<
  InternshipKind,
  Record<AssessmentStatus, string>
> = {
  immersion: {
    COMPLETED: "Oui, l'immersion a eu lieu aux horaires prévus",
    PARTIALLY_COMPLETED:
      "Oui, mais les horaires ont changé (abandon en cours, absences, retards, etc.)",
    DID_NOT_SHOW: "Non, le candidat n'est jamais venu",
  },
  "mini-stage-cci": {
    COMPLETED: "Oui, le mini-stage a eu lieu aux horaires prévus",
    PARTIALLY_COMPLETED:
      "Oui, mais les horaires ont changé (abandon en cours, absences, retards, etc.)",
    DID_NOT_SHOW: "Non, le candidat n'est jamais venu",
  },
};

const getLabels = (
  internshipKind: InternshipKind,
): Record<AssessmentStatus, string> => ({
  COMPLETED: wordingByInternshipKind[internshipKind].COMPLETED,
  PARTIALLY_COMPLETED:
    wordingByInternshipKind[internshipKind].PARTIALLY_COMPLETED,
  DID_NOT_SHOW: wordingByInternshipKind[internshipKind].DID_NOT_SHOW,
});

const AssessmentStatusSection = ({
  convention,
  onStepChange,
}: {
  convention: ConventionDto;
  onStepChange: OnStepChange;
}) => {
  const { register, formState, watch, setValue } =
    useFormContext<AssessmentDto>();
  const getFieldError = makeFieldError(formState);
  const formValues = watch();
  const [numberOfMissedHoursDisplayed, setNumberOfMissedHoursDisplayed] =
    useState<number | null>(null);
  const [numberOfMissedMinutesDisplayed, setNumberOfMissedMinutesDisplayed] =
    useState<number | null>(null);
  const assessmentStatus = watch("status");

  useEffect(() => {
    if (
      formValues.status === "PARTIALLY_COMPLETED" &&
      formValues.numberOfMissedHours > 0
    ) {
      setNumberOfMissedHoursDisplayed(
        Math.floor(formValues.numberOfMissedHours),
      );
      setNumberOfMissedMinutesDisplayed(
        +(
          (formValues.numberOfMissedHours -
            Math.floor(formValues.numberOfMissedHours)) *
          60
        ).toFixed(2),
      );
    }
  }, [formValues]);

  const totalHours = computeTotalHours(
    convention,
    (numberOfMissedHoursDisplayed ?? 0) +
      (numberOfMissedMinutesDisplayed ?? 0) / 60,
    assessmentStatus,
  );
  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-lg-7")}>
          <RadioButtons
            id={domElementIds.assessment.statusInput}
            options={assessmentStatuses.map((value) => ({
              label: getLabels(convention.internshipKind)[value],
              nativeInputProps: {
                value,
                ...register("status"),
                onChange: (event) => {
                  const { value } = event.target;
                  if (
                    value === "PARTIALLY_COMPLETED" &&
                    !("numberOfMissedHours" in formValues)
                  ) {
                    setValue("numberOfMissedHours", 0);
                  }
                  setValue("status", value as AssessmentStatus);
                },
              },
            }))}
            {...getFieldError("status")}
          />
          {formValues.status === "PARTIALLY_COMPLETED" && (
            <>
              <Input
                label="Dernier jour de présence"
                hintText={`Date indiquée dans la convention : ${toDisplayedDate(
                  {
                    date: convertLocaleDateToUtcTimezoneDate(
                      new Date(convention.dateEnd),
                    ),
                  },
                )}`}
                nativeInputProps={{
                  type: "date",
                  ...register("lastDayOfPresence"),
                  id: domElementIds.assessment.lastDayOfPresenceInput,
                  defaultValue: convention.dateEnd,
                }}
                {...getFieldError("lastDayOfPresence")}
              />
              <p className={fr.cx("fr-mb-2w")}>
                L'immersion représente actuellement{" "}
                {hoursValueToHoursDisplayed({
                  hoursValue: convention.schedule.totalHours,
                  padWithZero: false,
                })}
                , pouvez-vous indiquer le nombre d'heures manquées ?
              </p>
              <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <Input
                  className={fr.cx("fr-col-12", "fr-col-sm-6")}
                  label="Heures manquées"
                  nativeInputProps={{
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = +event.target.value;
                      setNumberOfMissedHoursDisplayed(value);
                      setValue(
                        "numberOfMissedHours",
                        value + (numberOfMissedMinutesDisplayed ?? 0) / 60,
                      );
                    },
                    min: 0,
                    max: convention.schedule.totalHours,
                    pattern: "\\d*",
                    type: "number",
                    id: domElementIds.assessment.numberOfMissedHoursInput,
                    value: numberOfMissedHoursDisplayed ?? "",
                  }}
                  {...getFieldError("numberOfMissedHours")}
                />
                <Input
                  className={fr.cx("fr-col-12", "fr-col-sm-6")}
                  label="Minutes manquées"
                  nativeInputProps={{
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = +event.target.value;
                      setNumberOfMissedMinutesDisplayed(value);
                      setValue(
                        "numberOfMissedHours",
                        (numberOfMissedHoursDisplayed ?? 0) + value / 60,
                      );
                    },
                    min: 0,
                    max: 60,
                    pattern: "\\d*",
                    type: "number",
                    id: domElementIds.assessment.numberOfMissedMinutesInput,
                    value: numberOfMissedMinutesDisplayed ?? "",
                  }}
                  {...getFieldError("numberOfMissedHours")}
                />
              </div>
            </>
          )}
          {formValues.status !== "DID_NOT_SHOW" && (
            <ConventionTotalHours
              totalHours={totalHours}
              illustration={<img src={commonIllustrations.warning} alt="" />}
            />
          )}
        </div>
      </div>
      {printWeekSchedule({
        schedule: convention.schedule,
        dateEnd: convention.dateEnd,
        dateStart: convention.dateStart,
        useWrapper: true,
      })}
      <ButtonsGroup
        inlineLayoutWhen="always"
        buttons={[
          {
            children: "Revenir à l'étape précédente",
            disabled: true,
            type: "button",
            priority: "secondary",
            id: domElementIds.assessment.previousButtonForStep({
              currentStep: 1,
            }),
          },
          {
            children: "Passer à l'étape suivante",
            onClick: () =>
              onStepChange(2, [
                "status",
                ...(formValues.status === "PARTIALLY_COMPLETED"
                  ? (["numberOfMissedHours", "lastDayOfPresence"] as const)
                  : []),
              ]),
            type: "button",
            priority: "primary",
            id: domElementIds.assessment.nextButtonFromStepAndMode({
              currentStep: 1,
            }),
          },
        ]}
      />
    </>
  );
};

const computeTotalHours = (
  convention: ConventionDto,
  missedHours: number,
  assessmentStatus: AssessmentStatus,
) =>
  match(assessmentStatus)
    .with("COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours,
        padWithZero: false,
      }),
    )
    .with("PARTIALLY_COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours - missedHours,
        padWithZero: false,
      }),
    )
    .with("DID_NOT_SHOW", () => hoursValueToHoursDisplayed({ hoursValue: 0 }))
    .exhaustive();

const AssessmentContractSection = ({
  onStepChange,
}: {
  onStepChange: OnStepChange;
}) => {
  const { register, watch, setValue, formState } =
    useFormContext<AssessmentDto>();
  const endedWithAJobValue = watch("endedWithAJob");
  const getFieldError = makeFieldError(formState);
  return (
    <>
      <RadioButtons
        legend="L'immersion a-t-elle débouché sur une embauche ?"
        id={domElementIds.assessment.endedWithAJobInput}
        options={[
          {
            label: "Oui",
            nativeInputProps: {
              name: register("endedWithAJob").name,
              onChange: () => {
                setValue("endedWithAJob", true);
              },
              checked: endedWithAJobValue,
            },
          },
          {
            label: "Non",
            nativeInputProps: {
              name: register("endedWithAJob").name,
              onChange: () => {
                setValue("endedWithAJob", false);
              },
              checked: !endedWithAJobValue,
            },
          },
        ]}
      />
      {endedWithAJobValue && (
        <>
          <Select
            label="Type de contrat associé à l’embauche :"
            id={domElementIds.assessment.typeOfContractInput}
            options={typeOfContracts.map((contractType) => ({
              label: contractType,
              value: contractType,
            }))}
            nativeSelectProps={{
              ...register("typeOfContract"),
            }}
            {...getFieldError("typeOfContract")}
          />

          <Input
            label="Date de début du contrat :"
            nativeInputProps={{
              ...register("contractStartDate"),
              id: domElementIds.assessment.contractStartDateInput,
              type: "date",
            }}
            {...getFieldError("contractStartDate")}
          />
        </>
      )}
      <ButtonsGroup
        inlineLayoutWhen="always"
        buttons={[
          {
            children: "Revenir à l'étape précédente",
            disabled: false,
            type: "button",
            onClick: () => onStepChange(1, []),
            priority: "secondary",
            id: domElementIds.assessment.previousButtonForStep({
              currentStep: 2,
            }),
          },
          {
            children: "Passer à l'étape suivante",
            onClick: () =>
              onStepChange(
                3,
                endedWithAJobValue
                  ? ["typeOfContract", "contractStartDate"]
                  : [],
              ),
            type: "button",
            priority: "primary",
            id: domElementIds.assessment.nextButtonFromStepAndMode({
              currentStep: 2,
            }),
          },
        ]}
      />
    </>
  );
};

const AssessmentCommentsSection = ({
  onStepChange,
  jobTitle,
  objective,
}: {
  onStepChange: OnStepChange;
  jobTitle: string;
  objective: string;
}) => {
  const { register, formState } = useFormContext<AssessmentDto>();
  const getFieldError = makeFieldError(formState);
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-lg-8")}>
        <ConventionJobAndObjective
          jobIllustration={<img src={commonIllustrations.job} alt="" />}
          objectiveIllustration={
            <img src={commonIllustrations.objective} alt="" />
          }
          jobTitle={jobTitle}
          objective={objective}
        />
        <Input
          textArea
          label="Avez-vous une appréciation générale à donner sur l'immersion ?"
          nativeTextAreaProps={{
            ...register("establishmentFeedback"),
            id: domElementIds.assessment.establishmentAdvicesInput,
          }}
          {...getFieldError("establishmentFeedback")}
        />
        <Input
          textArea
          label="Sur la base de l'objectif de l'immersion et du métier observé, quels conseils donneriez-vous au candidat pour la suite de son parcours professionnel ?"
          nativeTextAreaProps={{
            ...register("establishmentAdvices"),
            id: domElementIds.assessment.establishmentFeedbackInput,
          }}
          {...getFieldError("establishmentAdvices")}
        />
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttons={[
            {
              children: "Revenir à l'étape précédente",
              type: "button",
              onClick: () => onStepChange(2, []),
              priority: "secondary",
              id: domElementIds.assessment.previousButtonForStep({
                currentStep: 3,
              }),
            },
            {
              children: "Envoyer le bilan",
              type: "submit",
              priority: "primary",
              id: domElementIds.assessment.formSubmitButton,
            },
          ]}
        />
      </div>
    </div>
  );
};

const AssessmentSuccessMessage = ({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) => (
  <div className={fr.cx("fr-grid-row", "fr-grid-row--top")}>
    <div
      className={fr.cx("fr-col-lg-8")}
      id={domElementIds.assessment.successMessage}
    >
      <h2>Merci d'avoir rempli le bilan !</h2>
      <p>
        Nous vous remercions d'avoir utilisé Immersion Facilitée pour
        accompagner {firstName} {lastName} dans son immersion. Votre implication
        contribue à améliorer notre site et à enrichir le dossier du candidat.
      </p>
      <h3>Que faire ensuite ?</h3>
      <p>
        Maintenez à jour votre fiche entreprise afin de continuer à recevoir des
        immersions.
      </p>
      <p>À bientôt sur Immersion Facilitée !</p>
      <Button
        priority="primary"
        onClick={() => {
          routes.establishmentDashboard().push();
        }}
      >
        Accéder à ma fiche entreprise
      </Button>
    </div>
    <div
      className={fr.cx(
        "fr-col-lg-3",
        "fr-col-offset-lg-1",
        "fr-hidden",
        "fr-unhidden-lg",
      )}
    >
      <img src={commonIllustrations.success} alt="" />
    </div>
  </div>
);
