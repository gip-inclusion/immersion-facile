import { mergeDeepRight } from "ramda";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { ConventionDto, ConventionReadDto, keys } from "shared";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "../../../../core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  ConventionSubmitFeedback,
} from "../../../../core-logic/domain/convention/convention.slice";
import { ConventionFeedbackNotification } from "../../../components/forms/convention/ConventionFeedbackNotification";
import { ConventionFormFields } from "../../../components/forms/convention/ConventionFormFields";
import { useAppSelector } from "../../../hooks/reduxHooks";
import { fr } from "@codegouvfr/react-dsfr";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";

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
  const methods = useForm<ConventionReadDto>({
    defaultValues: convention,
  });
  const t = useConventionTexts(convention.internshipKind);

  const askFormModificationWithMessageForm = async (): Promise<void> => {
    const statusJustification = prompt(
      "Précisez la raison et la modification nécessaire *",
    )?.trim();

    if (statusJustification === null || statusJustification === undefined)
      return;
    if (statusJustification === "") return askFormModificationWithMessageForm();

    dispatch(
      conventionSlice.actions.statusChangeRequested({
        conventionId: convention.id,
        updateStatusParams: { status: "DRAFT", statusJustification },
        feedbackKind: "modificationsAskedFromSignatory",
        jwt,
      }),
    );
  };
  return (
    // <Formik
    //   enableReinitialize={true}
    //   initialValues={convention}
    //   validationSchema={toFormikValidationSchema(conventionSchema)}
    //   onSubmit={(values, formikHelpers) =>
    //     onConventionSignFormSubmit(
    //       values,
    //       formikHelpers,
    //       currentSignatory,
    //       convention,
    //       dispatch,
    //       jwt,
    //     )
    //   }
    // >
    //   {(props) => {
    //     if (Object.values(props.errors).length > 0) {
    //       // eslint-disable-next-line no-console
    //       console.log("Erros in form : ", props.errors);
    //     }

    //     return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
      <div className={fr.cx("fr-col-12", "fr-col-lg-7")}>
        <div className={fr.cx("fr-text--regular")}>
          <p
            className={fr.cx("fr-text--md")}
            dangerouslySetInnerHTML={{ __html: t.sign.summary }}
          />

          <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>
            {t.sign.regulations}
          </p>
        </div>
        <FormProvider {...methods}>
          <form>
            {currentSignatory && (
              <ConventionFormFields
                isFrozen={true}
                onSubmit={(values) => {
                  if (!currentSignatory) return;

                  // Confirm checkbox
                  const { signedAtFieldName, signatory } =
                    signatoryDataFromConvention(
                      mergeDeepRight(
                        convention as ConventionDto,
                        values as ConventionDto,
                      ) as ConventionDto,
                      currentSignatory.role,
                    );

                  const conditionsAccepted = !!signatory?.signedAt;
                  const { setError } = methods;
                  if (!conditionsAccepted) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    setError(signedAtFieldName! as keyof ConventionReadDto, {
                      type: "required",
                      message: "La signature est obligatoire",
                    });
                    return Promise.reject("La signature est obligatoire");
                  }

                  dispatch(
                    conventionSlice.actions.signConventionRequested({
                      jwt,
                      role: signatory.role,
                      signedAt: new Date().toISOString(),
                    }),
                  );
                  return Promise.resolve();
                }}
                isSignOnly={true}
                signatory={currentSignatory}
                onModificationsRequired={askFormModificationWithMessageForm}
              />
            )}
            {keys(methods.formState.errors).length > 0 && (
              <div style={{ color: "red" }}>
                Veuillez corriger les champs erronés
              </div>
            )}

            <ConventionFeedbackNotification
              submitFeedback={submitFeedback}
              signatories={methods.getValues().signatories}
            />
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

// const onConventionSignFormSubmit: SubmitHandler<ConventionReadDto> = (
//   values: ConventionDto,
//   { setErrors, setSubmitting }: FormikHelpers<ConventionReadDto>,
//   currentSignatory: Signatory | null,
//   convention: ConventionReadDto,
//   dispatch: Dispatch<any>,
//   jwt: string,
// ) => {
//   if (!currentSignatory) return;

//   // Confirm checkbox
//   const { signedAtFieldName, signatory } = signatoryDataFromConvention(
//     mergeDeepRight(
//       convention as ConventionDto,
//       values as ConventionDto,
//     ) as ConventionDto,
//     currentSignatory.role,
//   );

//   const conditionsAccepted = !!signatory?.signedAt;

//   if (!conditionsAccepted) {
//     setErrors({
//       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//       [signedAtFieldName!]: "La signature est obligatoire",
//     });

//     setSubmitting(false);
//     return;
//   }

//   dispatch(
//     conventionSlice.actions.signConventionRequested({
//       jwt,
//       role: signatory.role,
//       signedAt: new Date().toISOString(),
//     }),
//   );
// };
