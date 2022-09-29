import { Formik, FormikProps, FormikValues } from "formik";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Title } from "react-design-system/immersionFacile";
import { conventionUkraineSchema } from "shared";
import { ConventionSubmitFeedbackNotification } from "src/app/components/ConventionSubmitFeedbackNotification";
import { conventionGateway } from "src/app/config/dependencies";
import { ConventionFormFieldsUkraine } from "src/app/pages/Convention/ConventionFields/ConventionFormFieldsUkraine";
import { ConventionPresentation } from "src/app/pages/Convention/conventionHelpers";
import { useConventionSubmitFeedback } from "src/app/pages/Convention/useConventionSubmitFeedback";
import { ConventionSubmitFeedback } from "src/core-logic/domain/convention/convention.slice";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type ConventionFormProps = {
  properties: ConventionPresentation;
};

export const ConventionFormUkraine = ({ properties }: ConventionFormProps) => {
  const [initialValues, setInitialValues] = useState(properties);
  const { submitFeedback, setSubmitFeedback } = useConventionSubmitFeedback();

  return (
    <>
      <StaticText />
      <FormikConventionForm
        initialValues={initialValues}
        setInitialValues={setInitialValues}
        setSubmitFeedback={setSubmitFeedback}
        submitFeedback={submitFeedback}
      />
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

const FormikConventionForm = ({
  initialValues,
  setInitialValues,
  setSubmitFeedback,
  submitFeedback,
}: {
  initialValues: ConventionPresentation;
  setInitialValues: Dispatch<SetStateAction<ConventionPresentation>>;
  setSubmitFeedback: (feedback: ConventionSubmitFeedback) => void;
  submitFeedback: ConventionSubmitFeedback;
}) => (
  <Formik
    enableReinitialize={true}
    initialValues={initialValues}
    validationSchema={toFormikValidationSchema(conventionUkraineSchema)}
    onSubmit={async (values, { setSubmitting }) => {
      try {
        const convention = conventionUkraineSchema.parse(values);

        await conventionGateway.add(convention);
        setInitialValues(convention);
        setSubmitFeedback("justSubmitted");
      } catch (e: any) {
        //eslint-disable-next-line no-console
        console.log("onSubmit", e);
        setSubmitFeedback(e);
      }
      setSubmitting(false);
    }}
  >
    {(props: FormikProps<FormikValues>) => (
      <div>
        <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
          <ConventionFormFieldsUkraine />
          <ConventionSubmitFeedbackNotification
            submitFeedback={submitFeedback}
            signatories={props.values.signatories}
          />
        </form>
      </div>
    )}
  </Formik>
);
