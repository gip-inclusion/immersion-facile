import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import Stepper, { StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { useState } from "react";
import {
  ConventionJobAndObjective,
  ConventionTotalHours,
  Loader,
} from "react-design-system";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
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
  hoursDisplayedToHoursValue,
  hoursValueToHoursDisplayed,
  toDisplayedDate,
  typeOfContracts,
} from "shared";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { ImmersionDescription } from "src/app/components/forms/assessment/ImmersionDescription";
import { printWeekSchedule } from "src/app/contents/convention/conventionSummary.helpers";
import { useAssessment } from "src/app/hooks/assessment.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { routes } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
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
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const { createAssessment, isLoading } = useAssessment(jwt);
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
    createAssessment(values);
  };
  const onStepChange: OnStepChange = async (step, fieldsToValidate) => {
    if (step && currentStep && step < currentStep) {
      setCurrentStep(step);
      return;
    }
    const validatedFields = await Promise.all(
      fieldsToValidate.map(async (key) => {
        return trigger(key);
      }),
    );
    if (validatedFields.every((validatedField) => validatedField)) {
      setCurrentStep(step);
    }
  };
  useScrollToTop(currentStep);
  return (
    <>
      {isLoading && <Loader />}
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
                    jobTitle={convention.immersionAppellation.appellationLabel}
                    objective={convention.immersionObjective}
                  />
                ))
                .exhaustive()}
            </form>
          </FormProvider>
        </>
      </WithFeedbackReplacer>
    </>
  );
};

const wordingByIntershipKind: Record<
  InternshipKind,
  Record<AssessmentStatus, string>
> = {
  immersion: {
    COMPLETED: "Oui, l'immersion a eue lieu aux horaires prévus",
    PARTIALLY_COMPLETED:
      "Oui, mais les horaires ont changé (abandon en cours, absences, retard, etc.)",
    DID_NOT_SHOW: "Non, le candidat n'est jamais venu",
  },
  "mini-stage-cci": {
    COMPLETED: "Oui, le mini-stage a eu lieu aux horaires prévus",
    PARTIALLY_COMPLETED:
      "Oui, mais les horaires ont changé (abandon en cours, absences, retard, etc.)",
    DID_NOT_SHOW: "Non, le candidat n'est jamais venu",
  },
};

const getLabels = (
  internshipKind: InternshipKind,
): Record<AssessmentStatus, string> => ({
  COMPLETED: wordingByIntershipKind[internshipKind].COMPLETED,
  PARTIALLY_COMPLETED:
    wordingByIntershipKind[internshipKind].PARTIALLY_COMPLETED,
  DID_NOT_SHOW: wordingByIntershipKind[internshipKind].DID_NOT_SHOW,
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
    useState("");
  const assessmentStatus = watch("status");
  const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value;
    input = input.replace(/[^0-9h]/g, "");
    if (/^\d{2}$/.test(input)) {
      input = `${input}h`;
    }
    if (!/^(\d{1,2}h?(\d{1,2})?)?$/.test(input)) {
      return;
    }
    setNumberOfMissedHoursDisplayed(input);
  };
  const totalHours = computeTotalHours(
    convention,
    hoursDisplayedToHoursValue(numberOfMissedHoursDisplayed),
    assessmentStatus,
  );
  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-lg-7")}>
          <RadioButtons
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
                label="Dernier jour de presence"
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
                  defaultValue: convention.dateEnd,
                }}
                {...getFieldError("lastDayOfPresence")}
              />
              <Input
                label={`L'immersion représente actuellement ${convention.schedule.totalHours} heures, pouvez vous indiquer le nombre d'heure manquées ?`}
                hintText={`Nombre total d'heures indiquées dans la convention : ${hoursValueToHoursDisplayed(
                  convention.schedule.totalHours,
                )}`}
                nativeInputProps={{
                  ...register("numberOfMissedHours", {
                    setValueAs: (value) => {
                      if (typeof value !== "string") return 0;
                      return hoursDisplayedToHoursValue(value);
                    },
                  }),
                  value: numberOfMissedHoursDisplayed,
                  onChange: handleHoursChange,
                }}
                {...getFieldError("numberOfMissedHours")}
              />
            </>
          )}
          <ConventionTotalHours
            totalHours={totalHours}
            illustration={<img src={commonIllustrations.warning} alt="" />}
          />
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
            children: "Revenir à l'étape précéden",
            disabled: true,
            type: "button",
            priority: "secondary",
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
      hoursValueToHoursDisplayed(convention.schedule.totalHours),
    )
    .with("PARTIALLY_COMPLETED", () =>
      hoursValueToHoursDisplayed(convention.schedule.totalHours - missedHours),
    )
    .with("DID_NOT_SHOW", () => hoursValueToHoursDisplayed(0))
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
            ...register("establishmentAdvices"),
          }}
          {...getFieldError("establishmentAdvices")}
        />
        <Input
          textArea
          label="Sur la base de l'objectif de l'immersion et du métier observé, quels conseils donneriez-vous au candidat pour la suite de son parcours professionnel ?"
          nativeTextAreaProps={{
            ...register("establishmentFeedback"),
          }}
          {...getFieldError("establishmentFeedback")}
        />
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttons={[
            {
              children: "Revenir à l'étape précédente",
              type: "button",
              onClick: () => onStepChange(2, []),
              priority: "secondary",
            },
            {
              children: "Envoyer le bilan",
              type: "submit",
              priority: "primary",
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
    <div className={fr.cx("fr-col-lg-8")}>
      <h2>Merci d'avoir rempli le bilan !</h2>
      <p>
        Nous vous remercions d`avoir utilisé Immersion Facilitée pour
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
