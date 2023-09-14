import React, { useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { mergeDeepRight } from "ramda";
import {
  ConventionDto,
  ConventionReadDto,
  isConventionRenewed,
  UpdateConventionStatusRequestDto,
} from "shared";
import { ConventionRenewedInformations } from "react-design-system";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import {
  ConventionFeedbackKind,
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

  const [isModalClosedWithoutSignature, SetIsModalClosedWithoutSignature] =
    useState<boolean>(false);

  const methods = useForm<ConventionReadDto>({
    defaultValues: convention,
    mode: "onTouched",
  });
  const t = useConventionTexts(convention.internshipKind);

  const onSignFormSubmit: SubmitHandler<ConventionReadDto> = (values): void => {
    if (!currentSignatory)
      throw new Error("Il n'y a pas de signataire identifié.");

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

  const onModificationRequired =
    (feedbackKind: ConventionFeedbackKind) =>
    (updateStatusParams: UpdateConventionStatusRequestDto) =>
      dispatch(
        conventionSlice.actions.statusChangeRequested({
          jwt,
          feedbackKind,
          updateStatusParams,
        }),
      );

  if (alreadySigned) {
    return (
      <Alert
        {...t.conventionAlreadySigned(convention.id, convention.agencyName)}
        severity="success"
      />
    );
  }
  return (
    <FormProvider {...methods}>
      <Alert
        {...t.conventionReadyToBeSigned}
        severity="info"
        className={fr.cx("fr-mb-4w")}
      />
      {isConventionRenewed(convention) && (
        <ConventionRenewedInformations renewed={convention.renewed} />
      )}
      <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>{t.sign.regulations}</p>
      <form>
        {currentSignatory && <ConventionSummary />}

        <ConventionFeedbackNotification
          submitFeedback={submitFeedback}
          signatories={methods.getValues().signatories}
        />
        {isModalClosedWithoutSignature && (
          <Alert
            {...t.conventionNeedToBeSign}
            closable={true}
            severity="warning"
            small
            className={fr.cx("fr-mb-5w")}
          />
        )}
        {currentSignatory && (
          <SignatureActions
            internshipKind={convention.internshipKind}
            signatory={currentSignatory}
            onSubmitClick={methods.handleSubmit(onSignFormSubmit, (errors) => {
              // eslint-disable-next-line no-console
              console.error(methods.getValues(), errors);
            })}
            convention={convention}
            newStatus="DRAFT"
            onModificationRequired={onModificationRequired(
              "modificationsAskedFromSignatory",
            )}
            currentSignatoryRole={currentSignatory.role}
            onCloseSignModalWithoutSignature={SetIsModalClosedWithoutSignature}
          />
        )}
      </form>
    </FormProvider>
  );
};
