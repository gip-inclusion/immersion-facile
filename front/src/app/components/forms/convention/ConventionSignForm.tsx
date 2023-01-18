import { Formik, FormikHelpers } from "formik";
import { mergeDeepRight } from "ramda";
import React, { Dispatch } from "react";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  ConventionReadDto,
  conventionSchema,
  Signatory,
} from "shared";
import { toFormikValidationSchema } from "../../../components/forms/commons/zodValidate";
import { ConventionFeedbackNotification } from "../../../components/forms/convention/ConventionFeedbackNotification";
import { ConventionFormFields } from "../../../components/forms/convention/ConventionFormFields";
import { useAppSelector } from "../../../hooks/reduxHooks";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "../../../../core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  ConventionSubmitFeedback,
} from "../../../../core-logic/domain/convention/convention.slice";

type ConventionSignFormProperties = {
  jwt: string;
  submitFeedback: ConventionSubmitFeedback;
  convention: ConventionReadDto;
};

export const ConventionSignForm = ({
  jwt,
  submitFeedback,
  convention,
}: ConventionSignFormProperties): JSX.Element => {
  const dispatch = useDispatch();
  const { signatory: currentSignatory } = useAppSelector(
    conventionSelectors.signatoryData,
  );
  const askFormModificationWithMessageForm = async (): Promise<void> => {
    const justification = prompt(
      "Précisez la raison et la modification nécessaire *",
    )?.trim();

    if (justification === null || justification === undefined) return;
    if (justification === "") return askFormModificationWithMessageForm();

    dispatch(
      conventionSlice.actions.statusChangeRequested({
        updateStatusParams: { status: "DRAFT", justification },
        feedbackKind: "modificationsAskedFromSignatory",
        jwt,
      }),
    );
  };
  return (
    <Formik
      enableReinitialize={true}
      initialValues={convention}
      validationSchema={toFormikValidationSchema(conventionSchema)}
      onSubmit={(values, formikHelpers) =>
        onConventionSignFormSubmit(
          values,
          formikHelpers,
          currentSignatory,
          convention,
          dispatch,
          jwt,
        )
      }
    >
      {(props) => {
        if (Object.values(props.errors).length > 0) {
          // eslint-disable-next-line no-console
          console.log("Erros in form : ", props.errors);
        }

        return (
          <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
            {currentSignatory && (
              <ConventionFormFields
                isFrozen={true}
                isSignOnly={true}
                signatory={currentSignatory}
                onModificationsRequired={askFormModificationWithMessageForm}
              />
            )}
            {Object.values(props.errors).length > 0 && (
              <div style={{ color: "red" }}>
                Veuillez corriger les champs erronés
              </div>
            )}

            <ConventionFeedbackNotification
              submitFeedback={submitFeedback}
              signatories={props.values.signatories}
            />
          </form>
        );
      }}
    </Formik>
  );
};

const onConventionSignFormSubmit = (
  values: ConventionDto,
  { setErrors, setSubmitting }: FormikHelpers<ConventionReadDto>,
  currentSignatory: Signatory | null,
  convention: ConventionReadDto,
  dispatch: Dispatch<any>,
  jwt: string,
) => {
  if (!currentSignatory) return;

  // Confirm checkbox
  const { signedAtFieldName, signatory } = signatoryDataFromConvention(
    mergeDeepRight(
      convention as ConventionDto,
      values as ConventionDto,
    ) as ConventionDto,
    currentSignatory.role,
  );

  const conditionsAccepted = !!signatory?.signedAt;

  if (!conditionsAccepted) {
    setErrors({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      [signedAtFieldName!]: "La signature est obligatoire",
    });

    setSubmitting(false);
    return;
  }

  dispatch(
    conventionSlice.actions.signConventionRequested({
      jwt,
      role: signatory.role,
      signedAt: new Date().toISOString(),
    }),
  );
};
