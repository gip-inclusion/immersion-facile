import { CircularProgress } from "@mui/material";
import { Form, Formik } from "formik";
import { identity } from "ramda";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  AssessmentStatus,
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentSchema } from "shared/src/immersionAssessment/immersionAssessmentSchema";
import { RadioGroupForField } from "src/app/components/RadioGroup";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { immersionAssessmentSlice } from "src/core-logic/domain/immersionAssessment/immersionAssessment.slice";
import { conventionStateSelector } from "src/core-logic/domain/immersionConvention/immersionConvention.selectors";
import { immersionConventionSlice } from "src/core-logic/domain/immersionConvention/immersionConvention.slice";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { Button } from "src/uiComponents/Button";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentProps {
  route: ImmersionAssessmentRoute;
}

const useImmersionApplication = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      immersionConventionSlice.actions.immersionConventionRequested(jwt),
    );
  }, []);
};

const useImmersionAssessment = () => {
  const dispatch = useDispatch();

  return {
    createAssessment: (assessment: ImmersionAssessmentDto): void => {
      dispatch(immersionAssessmentSlice.actions.creationRequested(assessment));
    },
  };
};

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentProps) => {
  useImmersionApplication(route.params.jwt);
  const { createAssessment } = useImmersionAssessment();
  const { convention, isLoading, error } = useAppSelector(
    conventionStateSelector,
  );

  return (
    <>
      <h1>Bilan de l'immersion</h1>
      {isLoading && <CircularProgress />}
      {error && <div>{error}</div>}
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
                  <Button type="submit">Envoyer</Button>
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
