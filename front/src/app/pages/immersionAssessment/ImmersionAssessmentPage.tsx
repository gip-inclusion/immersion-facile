import { CircularProgress } from "@mui/material";
import { Form, Formik } from "formik";
import { identity } from "ramda";
import React from "react";
import {
  AssessmentStatus,
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentSchema } from "shared/src/immersionAssessment/immersionAssessmentSchema";
import { RadioGroupForField } from "src/app/components/RadioGroup";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import {
  immersionAssessmentErrorSelector,
  immersionAssessmentStatusSelector,
} from "src/core-logic/domain/immersionAssessment/immersionAssessment.selectors";
import { conventionStateSelector } from "src/core-logic/domain/immersionConvention/immersionConvention.selectors";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { Button } from "src/uiComponents/Button";
import { ErrorMessage } from "src/uiComponents/form/ErrorMessage";
import { SuccessMessage } from "src/uiComponents/form/SuccessMessage";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";
import { useImmersionApplication } from "../../../hooks/immersionApplication";
import { useImmersionAssessment } from "../../../hooks/immersionAssessment";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentProps) => {
  useImmersionApplication(route.params.jwt);
  const { createAssessment } = useImmersionAssessment(route.params.jwt);
  const {
    convention,
    isLoading,
    error: conventionFetchError,
  } = useAppSelector(conventionStateSelector);
  const assessmentError = useAppSelector(immersionAssessmentErrorSelector);
  const assessmentStatus = useAppSelector(immersionAssessmentStatusSelector);
  return (
    <>
      <h1>Bilan de l'immersion</h1>
      {isLoading && <CircularProgress />}
      {conventionFetchError && <div>{conventionFetchError}</div>}

      {convention && (
        <>
          <FormAccordion immersionApplication={convention} />
          <Formik
            initialValues={identity<ImmersionAssessmentDto>({
              conventionId: convention.id,
              status: null as unknown as AssessmentStatus,
              establishmentFeedback: "",
            })}
            validationSchema={toFormikValidationSchema(
              immersionAssessmentSchema,
            )}
            onSubmit={createAssessment}
          >
            {() => (
              <Form>
                <div className="flex flex-col w-1/2 m-auto">
                  <div className="flex items-center justify-between">
                    <TextInput
                      label="Comment s'est passé l'immersion ?"
                      name={getName("establishmentFeedback")}
                    />
                    <RadioGroupForField
                      label="Status"
                      name={getName("status")}
                      options={assessmentStatuses.map((value) => ({
                        value,
                        label: labels[value],
                      }))}
                    />
                  </div>
                  <Button
                    type="submit"
                    disable={
                      assessmentStatus !== "Idle" || assessmentError !== null
                    }
                  >
                    Envoyer
                  </Button>
                  {assessmentError && (
                    <ErrorMessage title="Erreur">
                      {assessmentError}
                    </ErrorMessage>
                  )}
                  {assessmentStatus === "Success" && (
                    <SuccessMessage title={"Bilan envoyé"}>
                      Le bilan a bien été envoyé au conseiller
                    </SuccessMessage>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </>
      )}
    </>
  );
};

const getName = (name: keyof ImmersionAssessmentDto) => name;
const labels: Record<AssessmentStatus, string> = {
  ABANDONED: "Abandonné",
  FINISHED: "Terminé",
};
