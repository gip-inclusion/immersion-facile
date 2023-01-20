import { Formik, FormikProps } from "formik";
import React from "react";
import { useDispatch } from "react-redux";
import { conventionUkraineSchema } from "shared";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { ConventionFormFieldsUkraine } from "src/app/components/forms/convention/ConventionFormFieldsUkraine";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

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
        {(props: FormikProps<ConventionPresentation>): JSX.Element => (
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
    <div className="fr-text">
      <p className="fr-text--xs">
        Ce formulaire vaut équivalence du CERFA 13912 * 04
      </p>
    </div>
  </>
);
