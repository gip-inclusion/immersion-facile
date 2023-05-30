import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { mergeDeepRight } from "ramda";
import { ConventionDto, ConventionReadDto } from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";
import { ConventionSummary } from "./ConventionSummary";
import { SignatureActions } from "./SignatureActions";

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
  const alreadySigned = !!currentSignatory?.signedAt;

  const methods = useForm<ConventionReadDto>({
    defaultValues: convention,
    mode: "onTouched",
  });
  const t = useConventionTexts(convention.internshipKind);

  const onSignFormSubmit: SubmitHandler<ConventionReadDto> = (values): void => {
    if (!currentSignatory)
      throw new Error("Il n'y a pas de signataire identifié.");

    // Confirm checkbox
    const { signedAtFieldName, signatory } = signatoryDataFromConvention(
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
      throw new Error("La signature est obligatoire");
    }

    dispatch(
      conventionSlice.actions.signConventionRequested({
        jwt,
        role: signatory.role,
        signedAt: new Date().toISOString(),
      }),
    );
  };

  const askFormModificationWithMessageForm = (): void => {
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
    <FormProvider {...methods}>
      <Alert
        severity="info"
        title={"La convention est prête à être signée !"}
        description={t.sign.summary}
      />
      <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>{t.sign.regulations}</p>
      <form>
        {currentSignatory && <ConventionSummary />}

        <ConventionFeedbackNotification
          submitFeedback={submitFeedback}
          signatories={methods.getValues().signatories}
        />
        {currentSignatory && (
          <>
            {alreadySigned ? (
              <p>{t.conventionAlreadySigned}</p>
            ) : (
              <SignatureActions
                internshipKind={convention.internshipKind}
                alreadySigned={false}
                signatory={currentSignatory}
                onSubmitClick={methods.handleSubmit(
                  onSignFormSubmit,
                  (errors) => {
                    // eslint-disable-next-line no-console
                    console.error(methods.getValues(), errors);
                  },
                )}
                onModificationRequired={askFormModificationWithMessageForm}
              />
            )}
          </>
        )}
      </form>
    </FormProvider>
  );
};
