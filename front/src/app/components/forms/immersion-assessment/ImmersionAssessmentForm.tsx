import React from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { identity } from "ramda";
import {
  AssessmentStatus,
  assessmentStatuses,
  ConventionReadDto,
  domElementIds,
  ImmersionAssessmentDto,
  immersionAssessmentSchema,
  InternshipKind,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  immersionAssessmentErrorSelector,
  immersionAssessmentStatusSelector,
} from "src/core-logic/domain/immersionAssessment/immersionAssessment.selectors";
import { useImmersionAssessment } from "src/app/hooks/immersionAssessment";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

type ImmersionAssessmentFormProperties = {
  convention: ConventionReadDto;
  jwt: string;
};

export const ImmersionAssessmentForm = ({
  convention,
  jwt,
}: ImmersionAssessmentFormProperties): JSX.Element => {
  const { createAssessment } = useImmersionAssessment(jwt);
  const assessmentError = useAppSelector(immersionAssessmentErrorSelector);
  const assessmentStatus = useAppSelector(immersionAssessmentStatusSelector);
  const isDisabled = assessmentStatus !== "Idle" || assessmentError !== null;

  const methods = useForm<ImmersionAssessmentDto>({
    resolver: zodResolver(immersionAssessmentSchema),
    mode: "onTouched",
    defaultValues: identity<ImmersionAssessmentDto>({
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
              id: domElementIds.immersionAssessment.assessmentFormSubmitButton,
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
              onClick={downloadFullImmersionAssessmentPdf}
              nativeButtonProps={{
                id: domElementIds.immersionAssessment
                  .assessmentFormDownloadButton,
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

const downloadFullImmersionAssessmentPdf = () => {
  window.open(
    "https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf",
    "_blank",
  );
};
