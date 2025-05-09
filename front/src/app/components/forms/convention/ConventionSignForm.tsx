import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { mergeDeepRight } from "ramda";
import { useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
} from "react-design-system";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConventionDto,
  type ConventionReadDto,
  domElementIds,
  isConventionRenewed,
  toDisplayedDate,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { makeConventionSections } from "src/app/contents/convention/conventionSummary.helpers";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { commonIllustrations } from "src/assets/img/illustrations";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import { SignatureActions } from "./SignatureActions";
type ConventionSignFormProperties = {
  jwt: string;
  convention: ConventionReadDto;
};

export const ConventionSignForm = ({
  jwt,
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
      conventionActionSlice.actions.signConventionRequested({
        conventionId: convention.id,
        jwt,
        feedbackTopic: "convention-action-sign",
      }),
    );
  };

  if (alreadySigned) {
    return (
      <>
        <Alert
          {...t.conventionAlreadySigned(convention.id, convention.agencyName)}
          severity="success"
          className={fr.cx("fr-mb-5v")}
        />
        <ConventionSummary
          illustration={commonIllustrations.documentsAdministratifs}
          submittedAt={toDisplayedDate({
            date: new Date(convention.dateSubmission),
          })}
          summary={makeConventionSections(convention)}
          conventionId={convention.id}
        />
      </>
    );
  }
  return (
    <>
      <Feedback topics={["convention-action-sign"]} />
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
          {currentSignatory && (
            <ConventionSummary
              illustration={commonIllustrations.documentsAdministratifs}
              submittedAt={toDisplayedDate({
                date: new Date(convention.dateSubmission),
              })}
              summary={makeConventionSections(convention)}
              conventionId={convention.id}
            />
          )}
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
              onSubmitClick={methods.handleSubmit(
                onSignFormSubmit,
                (errors) => {
                  console.error(methods.getValues(), errors);
                },
              )}
              jwt={jwt}
              convention={convention}
              onCloseSignModalWithoutSignature={
                setIsModalClosedWithoutSignature
              }
            />
          )}
        </form>
      </FormProvider>
    </>
  );
};
