import { Formik, FormikProps, FormikValues } from "formik";
import React from "react";
import { Title } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { conventionUkraineSchema } from "shared";
import { ConventionFeedbackNotification } from "src/app/components/ConventionFeedbackNotification";
import { ConventionFormFieldsUkraine } from "src/app/components/forms/convention/ConventionFormFieldsUkraine";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useAppSelector } from "src/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";

type ConventionFormProps = {
  properties: ConventionPresentation;
};

export const ConventionFormUkraine = ({ properties }: ConventionFormProps) => {
  const dispatch = useDispatch();
  const submitFeedback = useAppSelector(conventionSelectors.feedback);

  return (
    <>
      <StaticText />
      <Formik
        enableReinitialize={true}
        initialValues={properties}
        validationSchema={toFormikValidationSchema(conventionUkraineSchema)}
        onSubmit={(values) => {
          const convention = conventionUkraineSchema.parse(values);
          dispatch(conventionSlice.actions.saveConventionRequested(convention));
        }}
      >
        {(props: FormikProps<FormikValues>) => (
          <div>
            <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
              <ConventionFormFieldsUkraine />
              <ConventionFeedbackNotification
                submitFeedback={submitFeedback}
                signatories={props.values.signatories}
              />
            </form>
          </div>
        )}
      </Formik>
    </>
  );
};

const StaticText = () => (
  <>
    <div className="flex justify-center">
      <Title red>
        Formulaire pour conventionner une période de mise en situation
        professionnelle (PMSMP) à destination des réfugiés ukrainiens
      </Title>
    </div>

    <div className="fr-text">
      <p className="fr-text--xs">
        Ce formulaire vaut équivalence du CERFA 13912 * 04
      </p>
    </div>
  </>
);
