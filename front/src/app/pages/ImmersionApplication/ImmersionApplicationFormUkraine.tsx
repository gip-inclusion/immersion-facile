import { Formik, FormikProps, FormikValues } from "formik";
import React, { Dispatch, SetStateAction, useState } from "react";
import {
  SubmitFeedback,
  SuccessFeedbackKind,
} from "src/app/components/SubmitFeedback";
import {
  agencyGateway,
  immersionApplicationGateway,
} from "src/app/config/dependencies";
import { ApplicationFormFields } from "src/app/pages/ImmersionApplication/ApplicationFormFields";
import { ImmersionApplicationPresentation } from "src/app/pages/ImmersionApplication/ImmersionApplicationPage";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "src/shared/ImmersionApplication/immersionApplication.schema";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Title } from "src/uiComponents/Title";

type ImmersionApplicationFormProps = {
  properties: ImmersionApplicationPresentation;
};

export const ImmersionApplicationFormUkraine = ({
  properties,
}: ImmersionApplicationFormProps) => {
  const [initialValues, setInitialValues] = useState(properties);
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  return (
    <>
      <StaticText />
      <FormikApplicationForm
        initialValues={initialValues}
        setInitialValues={setInitialValues}
        setSubmitFeedback={setSubmitFeedback}
        submitFeedback={submitFeedback}
      />
    </>
  );
};

const StaticText = () => {
  return (
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
};

const FormikApplicationForm = ({
  initialValues,
  setInitialValues,
  setSubmitFeedback,
  submitFeedback,
}: {
  initialValues: ImmersionApplicationPresentation;
  setInitialValues: Dispatch<SetStateAction<ImmersionApplicationPresentation>>;
  setSubmitFeedback: Dispatch<
    SetStateAction<SuccessFeedbackKind | Error | null>
  >;
  submitFeedback: SuccessFeedbackKind | Error | null;
}) => {
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(immersionApplicationSchema)}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          const immersionApplication: ImmersionApplicationDto =
            immersionApplicationSchema.parse(values);

          await immersionApplicationGateway.add(immersionApplication);
          setInitialValues(immersionApplication);
          setSubmitFeedback("justSubmitted");
        } catch (e: any) {
          console.log(e);
          setSubmitFeedback(e);
        }
        setSubmitting(false);
      }}
    >
      {(props: FormikProps<FormikValues>) => {
        return (
          <div>
            <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
              <ApplicationFormFields isUkraine={true} />
              <SubmitFeedback submitFeedback={submitFeedback} />
            </form>
          </div>
        );
      }}
    </Formik>
  );
};
