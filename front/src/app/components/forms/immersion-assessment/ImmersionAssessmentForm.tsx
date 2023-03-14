import React from "react";
import { Form, Formik } from "formik";
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
import { RadioGroupForField } from "src/app/components/forms/commons/RadioGroup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  immersionAssessmentErrorSelector,
  immersionAssessmentStatusSelector,
} from "src/core-logic/domain/immersionAssessment/immersionAssessment.selectors";
import { useImmersionAssessment } from "src/app/hooks/immersionAssessment";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

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
  return (
    <Formik
      initialValues={identity<ImmersionAssessmentDto>({
        conventionId: convention.id,
        status: null as unknown as AssessmentStatus,
        establishmentFeedback: "",
      })}
      validationSchema={toFormikValidationSchema(immersionAssessmentSchema)}
      onSubmit={createAssessment}
    >
      {() => (
        <Form>
          <RadioGroupForField
            label=""
            name={getName("status")}
            options={assessmentStatuses.map((value) => ({
              value,
              label: getLabels(convention.internshipKind)[value],
            }))}
          />
          <TextInput
            multiline={true}
            label={
              convention.internshipKind === "immersion"
                ? "Comment s'est passée l'immersion ?"
                : "Comment s'est passée le mini-stage ?"
            }
            name={getName("establishmentFeedback")}
          />
          <ul className={fr.cx("fr-btns-group")}>
            <li>
              <Button
                type="submit"
                disabled={isDisabled}
                nativeButtonProps={{
                  id: domElementIds.immersionAssessment
                    .assessmentFormSubmitButton,
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
        </Form>
      )}
    </Formik>
  );
};

const getName = (name: keyof ImmersionAssessmentDto) => name;
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
