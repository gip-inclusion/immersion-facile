import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import Stepper, { type StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  ConventionJobAndObjective,
  ConventionTotalHours,
  useScrollToTop,
} from "react-design-system";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type AssessmentDto,
  type AssessmentStatus,
  assessmentDtoSchema,
  assessmentStatuses,
  type ConventionDto,
  type ConventionReadDto,
  computeTotalHours,
  convertLocaleDateToUtcTimezoneDate,
  type DotNestedKeys,
  domElementIds,
  type FormAssessmentDto,
  type InternshipKind,
  type Role,
  toDisplayedDate,
  typeOfContracts,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { ImmersionDescription } from "src/app/components/forms/assessment/ImmersionDescription";
import { printWeekSchedule } from "src/app/contents/convention/conventionSummary.helpers";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { commonIllustrations } from "src/assets/img/illustrations";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { match } from "ts-pattern";

type AssessmentFormProperties = {
  convention: ConventionReadDto;
  jwt: string;
  currentUserRoles: Role[];
};

export type OnStepChange = (
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

  const initialValues: FormAssessmentDto = {
    conventionId: convention.id,
    establishmentFeedback: "",
    establishmentAdvices: "",
    endedWithAJob: null,
    status: null,
  };
  const methods = useForm<FormAssessmentDto>({
    resolver: zodResolver(assessmentDtoSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const { handleSubmit, trigger } = methods;

  const onSubmit = (values: FormAssessmentDto) => {
    if (values.status === null || values.endedWithAJob === null) {
      throw new Error(
        "Form validation failed: status or endedWithAJob is null",
      );
    }

    dispatch(
      assessmentSlice.actions.creationRequested({
        assessmentAndJwt: {
          assessment: formAssessmentDtoToAssessmentDto(values),
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

  return (
    <>
      <ImmersionDescription convention={convention} />
      <Feedback topics={["assessment"]} />
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
                jobTitle={convention.immersionAppellation.appellationLabel}
                objective={convention.immersionObjective}
              />
            ))
            .exhaustive()}
        </form>
      </FormProvider>
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
  const assessmentDto = formAssessmentDtoToAssessmentDto(formValues);
  const totalHours = computeTotalHours({
    convention: convention,
    lastDayOfPresence:
      assessmentDto.status === "PARTIALLY_COMPLETED"
        ? assessmentDto.lastDayOfPresence
        : "",
    numberOfMissedHours:
      assessmentDto.status === "PARTIALLY_COMPLETED"
        ? assessmentDto.numberOfMissedHours
        : 0,
    status: formValues.status,
  });

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-lg-7")}>
          <RadioButtons
            id={domElementIds.assessment.statusInput}
            legend="L'immersion a-t-elle été effectuée ? *"
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
                label="S’il y a eu une fin d’immersion anticipée, quelle a été la date du dernier jour de présence en entreprise ? *"
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

              {assessmentDto.status === "PARTIALLY_COMPLETED" &&
                assessmentDto.lastDayOfPresence && (
                  <Alert
                    className={fr.cx("fr-mb-2w")}
                    description="Vous avez indiqué que l’immersion s’est terminée plus tôt que
                prévu. Le total d’heures réalisées a été ajusté automatiquement."
                    severity="info"
                    small
                  />
                )}

              <p className={fr.cx("fr-mb-2v")}>
                Pendant les jours réels de présence, combien d'heures ont été
                manquées en raison d’absences ou de retards ?
              </p>

              <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <Input
                  className={fr.cx("fr-col-12", "fr-col-sm-6")}
                  label="Heures manquées"
                  nativeInputProps={{
                    onChange: (event: ChangeEvent<HTMLInputElement>) => {
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
                    value: numberOfMissedHoursDisplayed || "",
                  }}
                  {...getFieldError("numberOfMissedHours")}
                />
                <Input
                  className={fr.cx("fr-col-12", "fr-col-sm-6")}
                  label="Minutes manquées"
                  nativeInputProps={{
                    onChange: (event: ChangeEvent<HTMLInputElement>) => {
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
                    value: numberOfMissedMinutesDisplayed || "",
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
        legend="L'immersion a-t-elle débouché sur une embauche ? *"
        id={domElementIds.assessment.endedWithAJobInput}
        options={[
          {
            label: "Oui",
            nativeInputProps: {
              name: register("endedWithAJob").name,
              onChange: () => {
                setValue("endedWithAJob", true);
              },
              checked: endedWithAJobValue === true,
            },
          },
          {
            label: "Non",
            nativeInputProps: {
              name: register("endedWithAJob").name,
              onChange: () => {
                setValue("endedWithAJob", false);
              },
              checked: endedWithAJobValue === false,
            },
          },
        ]}
        {...getFieldError("endedWithAJob")}
      />
      {endedWithAJobValue && (
        <div className={fr.cx("fr-grid-row", "fr-mb-4w")}>
          <div className={fr.cx("fr-col-lg-5")}>
            <Select
              label="Type de contrat associé à l’embauche : *"
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
              label="Date de début du contrat : *"
              nativeInputProps={{
                ...register("contractStartDate"),
                id: domElementIds.assessment.contractStartDateInput,
                type: "date",
              }}
              {...getFieldError("contractStartDate")}
            />
          </div>
        </div>
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
                  ? ["typeOfContract", "contractStartDate", "endedWithAJob"]
                  : ["endedWithAJob"],
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
          label="Avez-vous une appréciation générale à donner sur l'immersion ? *"
          nativeTextAreaProps={{
            ...register("establishmentFeedback"),
            id: domElementIds.assessment.establishmentAdvicesInput,
          }}
          {...getFieldError("establishmentFeedback")}
        />
        <Input
          textArea
          label="Sur la base de l'objectif de l'immersion et du métier observé, quels conseils donneriez-vous au candidat pour la suite de son parcours professionnel ? *"
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

export const formAssessmentDtoToAssessmentDto = (
  formAssessmentDto: FormAssessmentDto,
): AssessmentDto => {
  const commonFields = {
    conventionId: formAssessmentDto.conventionId,
    establishmentFeedback: formAssessmentDto.establishmentFeedback,
    establishmentAdvices: formAssessmentDto.establishmentAdvices,
  };

  let assessmentDto: AssessmentDto = {
    ...commonFields,
    status: "COMPLETED",
    endedWithAJob: false,
  };

  if (formAssessmentDto.status === "DID_NOT_SHOW") {
    assessmentDto = {
      ...assessmentDto,
      status: "DID_NOT_SHOW",
    };
  }

  if (
    formAssessmentDto.endedWithAJob &&
    formAssessmentDto.typeOfContract &&
    formAssessmentDto.contractStartDate
  ) {
    assessmentDto = {
      ...assessmentDto,
      endedWithAJob: true,
      typeOfContract: formAssessmentDto.typeOfContract,
      contractStartDate: formAssessmentDto.contractStartDate,
    };
  }

  if (
    formAssessmentDto.status === "PARTIALLY_COMPLETED" &&
    formAssessmentDto.lastDayOfPresence &&
    formAssessmentDto.numberOfMissedHours !== undefined
  ) {
    assessmentDto = {
      ...assessmentDto,
      status: "PARTIALLY_COMPLETED",
      lastDayOfPresence: formAssessmentDto.lastDayOfPresence,
      numberOfMissedHours: formAssessmentDto.numberOfMissedHours,
    };
  }

  return assessmentDto;
};
