import React from "react";
import { useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { identity } from "ramda";
import {
  AssessmentDto,
  assessmentSchema,
  AssessmentStatus,
  assessmentStatuses,
  ConventionReadDto,
  domElementIds,
  InternshipKind,
} from "shared";
import { useAssessment } from "src/app/hooks/assessment.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  assessmentErrorSelector,
  assessmentStatusSelector,
} from "src/core-logic/domain/assessment/assessment.selectors";

type AssessmentFormProperties = {
  convention: ConventionReadDto;
  jwt: string;
};

export const AssessmentForm = ({
  convention,
  jwt,
}: AssessmentFormProperties): JSX.Element => {
  const { createAssessment } = useAssessment(jwt);
  const assessmentError = useAppSelector(assessmentErrorSelector);
  const assessmentStatus = useAppSelector(assessmentStatusSelector);
  const isDisabled = assessmentStatus !== "Idle" || assessmentError !== null;

  const methods = useForm<AssessmentDto>({
    resolver: zodResolver(assessmentSchema),
    mode: "onTouched",
    defaultValues: identity<AssessmentDto>({
      conventionId: convention.id,
      status: null as unknown as AssessmentStatus,
      establishmentFeedback: "",
    }),
  });
  const { register, handleSubmit, formState } = methods;

  const getFieldError = makeFieldError(formState);

  return (
    <form onSubmit={handleSubmit(createAssessment)}>
      <RadioButtons
        options={assessmentStatuses.map((value) => ({
          label: getLabels(convention.internshipKind)[value],
          nativeInputProps: {
            value,
            ...register("status"),
          },
        }))}
        {...getFieldError("status")}
      />
      <Input
        label={
          convention.internshipKind === "immersion"
            ? "Comment s'est passée l'immersion ?"
            : "Comment s'est passée le mini-stage ?"
        }
        textArea
        nativeTextAreaProps={{
          ...register("establishmentFeedback"),
          rows: 6,
        }}
        {...getFieldError("establishmentFeedback")}
      />
      <ul className={fr.cx("fr-btns-group")}>
        <li>
          <Button
            type="submit"
            disabled={isDisabled}
            nativeButtonProps={{
              id: domElementIds.assessment.assessmentFormSubmitButton,
            }}
          >
            Envoyer
          </Button>
          {assessmentError && (
            <Alert
              severity="error"
              title="Erreur"
              className={fr.cx("fr-mx-1w", "fr-mb-4w")}
              description={assessmentError}
            />
          )}
          {assessmentStatus === "Success" && (
            <Alert
              severity="success"
              title={"Bilan envoyé"}
              className={fr.cx("fr-mx-1w", "fr-mb-4w")}
              description="Le bilan a bien été envoyé au conseiller"
            />
          )}
        </li>
        {isDisabled && (
          <li>
            <Button
              priority="secondary"
              type="button"
              onClick={downloadFullAssessmentPdf}
              nativeButtonProps={{
                id: domElementIds.assessment.assessmentFormDownloadButton,
              }}
            >
              Télécharger le bilan détaillé en PDF
            </Button>
          </li>
        )}
      </ul>
    </form>
  );
};

const getLabels = (
  internshipKind: InternshipKind,
): Record<AssessmentStatus, string> => ({
  FINISHED:
    internshipKind === "immersion"
      ? "Le bénéficiaire a suivi son immersion jusqu'à la fin"
      : "Le bénéficiaire a suivi son mini-stage jusqu'à la fin",
  ABANDONED:
    internshipKind === "immersion"
      ? "Le bénéficiaire a abandonné l'immersion"
      : "Le bénéficiaire a abandonné le mini-stage",
});

const downloadFullAssessmentPdf = () => {
  window.open(
    "https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf",
    "_blank",
  );
};
