import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { formatDistance } from "date-fns";
import { fr as french } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionReadDto,
  type Phone,
  type SignatoryRole,
  isConventionRenewed,
  toDisplayedDate,
} from "shared";
import type { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
import { Feedback } from "src/app/components/feedback/Feedback";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { commonIllustrations } from "src/assets/img/illustrations";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { useStyles } from "tss-react/dsfr";
import {
  SendSignatureLinkModalWrapper,
  type SignatureLinkState,
  makeConventionSections,
  sendSignatureLinkButtonProps,
  sendSignatureLinkModal,
} from "../../../contents/convention/conventionSummary.helpers";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: french,
  });
};

export interface ConventionValidationProps {
  convention: ConventionReadDto;
  jwtParams: JwtKindProps;
}

export const ConventionValidation = ({
  convention,
  jwtParams,
}: ConventionValidationProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();

  useScrollToTop(!!useFeedbackTopic("send-signature-link"));

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

  const closeSendSignatureLinkModal = () => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    sendSignatureLinkModal.close();
  };

  const isModalOpen = useIsModalOpen(sendSignatureLinkModal, {
    onConceal: () => closeSendSignatureLinkModal(),
  });

  useEffect(() => {
    if (!isModalOpen) setSignatoryToSendSignatureLink(null);
  }, [isModalOpen]);

  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const title = `${beneficiary.lastName.toUpperCase()} ${
    beneficiary.firstName
  } chez ${businessName} ${beforeAfterString(dateStart)}`;

  const onSubmitSendSignatureLink = () => {
    if (signatoryToSendSignatureLink) {
      const { signatoryRole } = signatoryToSendSignatureLink;

      dispatch(
        sendSignatureLinkSlice.actions.sendSignatureLinkRequested({
          conventionId: convention.id,
          signatoryRole,
          jwt: jwtParams.jwt,
          feedbackTopic: "send-signature-link",
        }),
      );

      setSignatureLinksSent((prev) => ({
        ...prev,
        [signatoryRole]: true,
      }));
    }
  };

  return (
    <>
      <Badge
        className={cx(
          fr.cx("fr-mb-3w"),
          labelAndSeverityByStatus[status].color,
        )}
      >
        {labelAndSeverityByStatus[status].label}
      </Badge>
      <h1 className={fr.cx("fr-h3")}>{title}</h1>
      {convention.statusJustification && (
        <p>Justification : {convention.statusJustification}</p>
      )}
      <Feedback
        topics={["send-signature-link"]}
        className={fr.cx("fr-my-4w")}
      />
      {isConventionRenewed(convention) && (
        <ConventionRenewedInformations renewed={convention.renewed} />
      )}
      <ConventionSummary
        illustration={commonIllustrations.documentsAdministratifs}
        submittedAt={toDisplayedDate({
          date: new Date(convention.dateSubmission),
        })}
        summary={makeConventionSections(
          convention,
          sendSignatureLinkButtonProps({
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
      <SendSignatureLinkModalWrapper
        signatory={signatoryToSendSignatureLink?.signatoryRole}
        signatoryPhone={signatoryToSendSignatureLink?.signatoryPhone}
        onConfirm={onSubmitSendSignatureLink}
      />
    </>
  );
};
