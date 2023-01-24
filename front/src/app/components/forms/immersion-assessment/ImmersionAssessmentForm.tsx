import React from "react";
import { Form, Formik } from "formik";
import { identity } from "ramda";
import { Button, Notification } from "react-design-system";
import {
  AssessmentStatus,
  assessmentStatuses,
  ConventionReadDto,
  ImmersionAssessmentDto,
  immersionAssessmentSchema,
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
              label: labels[value],
            }))}
          />
          <TextInput
            multiline={true}
            label="Comment s'est passée l'immersion ?"
            name={getName("establishmentFeedback")}
          />
          <ul className={fr.cx("fr-btns-group")}>
            <li>
              <Button
                type="submit"
                disable={isDisabled}
                id={"im-assessment-form__submit-button"}
              >
                Envoyer
              </Button>
              {assessmentError && (
                <Notification
                  type="error"
                  title="Erreur"
                  className={fr.cx("fr-mx-1w", "fr-mb-4w")}
                >
                  {assessmentError}
                </Notification>
              )}
              {assessmentStatus === "Success" && (
                <Notification
                  type="success"
                  title={"Bilan envoyé"}
                  className={fr.cx("fr-mx-1w", "fr-mb-4w")}
                >
                  Le bilan a bien été envoyé au conseiller
                </Notification>
              )}
            </li>
            {isDisabled && (
              <li>
                <Button
                  level="secondary"
                  type="button"
                  onSubmit={downloadFullImmersionAssessmentPdf}
                  id="im-assessment-form__download-button"
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
const labels: Record<AssessmentStatus, string> = {
  FINISHED: "Le bénéficiaire a suivi son immersion jusqu'à la fin",
  ABANDONED: "Le bénéficiaire a abandonné l'immersion",
};
const downloadFullImmersionAssessmentPdf = () => {
  window.open(
    "https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf",
    "_blank",
  );
};
