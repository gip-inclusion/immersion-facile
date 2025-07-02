import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { mergeDeepRight } from "ramda";
import { useEffect, useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
  useScrollToTop,
} from "react-design-system";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConventionDto,
  type ConventionReadDto,
  domElementIds,
  isConventionRenewed,
  type Phone,
  type SignatoryRole,
  toDisplayedDate,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import {
  makeConventionSections,
  SendSignatureLinkModalWrapper,
  type SignatureLinkState,
  sendSignatureLinkButtonProps,
  sendSignatureLinkModal,
} from "src/app/contents/convention/conventionSummary.helpers";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useFeedbackTopics } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { commonIllustrations } from "src/assets/img/illustrations";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
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

  const closeSendSignatureLinkModal = () => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    sendSignatureLinkModal.close();
  };

  const isSendSignatureLinkModalOpen = useIsModalOpen(sendSignatureLinkModal, {
    onConceal: () => closeSendSignatureLinkModal(),
  });

  const [signatoryToSendSignatureLink, setSignatoryToSendSignatureLink] =
    useState<{
      signatoryRole: SignatoryRole;
      signatoryPhone: Phone;
    } | null>(null);

  const [signatureLinksSent, setSignatureLinksSent] =
    useState<SignatureLinkState>({
      beneficiary: false,
      "establishment-representative": false,
      "beneficiary-representative": false,
      "beneficiary-current-employer": false,
    });

  const [isModalClosedWithoutSignature, setIsModalClosedWithoutSignature] =
    useState<boolean>(false);

  const methods = useForm<ConventionReadDto>({
    defaultValues: convention,
    mode: "onTouched",
  });
  const t = useConventionTexts(convention.internshipKind);

  const onSendSignatureLinkSubmit = () => {
    if (signatoryToSendSignatureLink) {
      const { signatoryRole } = signatoryToSendSignatureLink;

      dispatch(
        sendSignatureLinkSlice.actions.sendSignatureLinkRequested({
          conventionId: convention.id,
          signatoryRole,
          jwt,
          feedbackTopic: "send-signature-link",
        }),
      );

      setSignatureLinksSent((prev) => ({
        ...prev,
        [signatoryRole]: true,
      }));
    }
  };

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

  useScrollToTop(
    useFeedbackTopics(["send-signature-link", "convention-action-sign"])
      .length > 0,
  );

  useEffect(() => {
    if (!isSendSignatureLinkModalOpen) setSignatoryToSendSignatureLink(null);
  }, [isSendSignatureLinkModalOpen]);

  return (
    <>
      <Feedback topics={["send-signature-link"]} closable />
      {alreadySigned ? (
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
            summary={makeConventionSections(
              convention,
              sendSignatureLinkButtonProps({
                triggeredByRole: currentSignatory.role,
                signatureLinksSent,
                onClick: ({ signatoryRole, signatoryPhone }) => {
                  sendSignatureLinkModal.open();
                  setSignatoryToSendSignatureLink({
                    signatoryRole,
                    signatoryPhone,
                  });
                },
              }),
            )}
            conventionId={convention.id}
          />
        </>
      ) : (
        <FormProvider {...methods}>
          <Alert
            {...t.conventionReadyToBeSigned}
            severity="info"
            className={fr.cx("fr-mb-4w")}
          />
          {isConventionRenewed(convention) && (
            <ConventionRenewedInformations renewed={convention.renewed} />
          )}
          <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>
            {t.sign.regulations}
          </p>
          <form id={domElementIds.conventionToSign.form}>
            {currentSignatory && (
              <ConventionSummary
                illustration={commonIllustrations.documentsAdministratifs}
                submittedAt={toDisplayedDate({
                  date: new Date(convention.dateSubmission),
                })}
                summary={makeConventionSections(
                  convention,
                  sendSignatureLinkButtonProps({
                    triggeredByRole: currentSignatory.role,
                    signatureLinksSent,
                    onClick: ({ signatoryRole, signatoryPhone }) => {
                      sendSignatureLinkModal.open();
                      setSignatoryToSendSignatureLink({
                        signatoryRole,
                        signatoryPhone,
                      });
                    },
                  }),
                )}
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
                    // biome-ignore lint/suspicious/noConsole: debug purpose
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
      )}
      <SendSignatureLinkModalWrapper
        signatory={signatoryToSendSignatureLink?.signatoryRole}
        signatoryPhone={signatoryToSendSignatureLink?.signatoryPhone}
        onConfirm={onSendSignatureLinkSubmit}
      />
    </>
  );
};
