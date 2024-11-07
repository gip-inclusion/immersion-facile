import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { mergeDeepRight } from "ramda";
import React, { useState } from "react";
import { ConventionRenewedInformations } from "react-design-system";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  ConventionReadDto,
  UpdateConventionStatusRequestDto,
  domElementIds,
  isConventionRenewed,
} from "shared";
import { ConventionValidationSection } from "src/app/components/admin/conventions/ConventionValidationDetails";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { sections } from "src/app/contents/admin/conventionValidation";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import {
  ConventionFeedbackKind,
  ConventionSubmitFeedback,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
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

  const [isModalClosedWithoutSignature, setIsModalClosedWithoutSignature] =
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
      setError(signedAtFieldName as keyof ConventionReadDto, {
        type: "required",
        message: "La signature est obligatoire",
      });
      throw new Error("La signature est obligatoire");
    }

    dispatch(
      conventionSlice.actions.signConventionRequested({
        conventionId: convention.id,
        jwt,
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
      <>
        <Alert
          {...t.conventionAlreadySigned(convention.id, convention.agencyName)}
          severity="success"
          className={fr.cx("fr-mb-5v")}
        />
        {sections.map((list, index) => (
          <ConventionValidationSection
            // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
            key={index}
            convention={convention}
            list={list}
            index={index}
          />
        ))}
      </>
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
      <form id={domElementIds.conventionToSign.form}>
        {currentSignatory &&
          convention &&
          sections.map((list, index) => (
            <ConventionValidationSection
              // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
              key={index}
              convention={convention}
              list={list}
              index={index}
            />
          ))}

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
              console.error(methods.getValues(), errors);
            })}
            convention={convention}
            newStatus="DRAFT"
            onModificationRequired={onModificationRequired(
              "modificationsAskedFromSignatory",
            )}
            currentSignatoryRole={currentSignatory.role}
            onCloseSignModalWithoutSignature={setIsModalClosedWithoutSignature}
          />
        )}
      </form>
    </FormProvider>
  );
};
