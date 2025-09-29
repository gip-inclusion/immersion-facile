import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { intersection } from "ramda";
import { useEffect, useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
  useScrollToTop,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  agencyModifierRoles,
  allSignatoryRoles,
  type ConventionReadDto,
  getDaysBetween,
  isConventionRenewed,
  type PhoneNumber,
  type Role,
  relativeTimeFormat,
  type SignatoryRole,
  toDisplayedDate,
} from "shared";
import type { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
import { Feedback } from "src/app/components/feedback/Feedback";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useFeedbackTopics } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { commonIllustrations } from "src/assets/img/illustrations";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { sendAssessmentLinkSlice } from "src/core-logic/domain/assessment/send-assessment-link/sendAssessmentLink.slice";
import {
  canAssessmentBeFilled,
  isConventionEndingInOneDayOrMore,
} from "src/core-logic/domain/convention/convention.utils";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { useStyles } from "tss-react/dsfr";
import {
  makeConventionSections,
  SendAssessmentLinkModalWrapper,
  SendSignatureLinkModalWrapper,
  type SignatureLinkState,
  sendAssessmentLinkButtonProps,
  sendAssessmentLinkModal,
  sendSignatureLinkButtonProps,
  sendSignatureLinkModal,
} from "../../../contents/convention/conventionSummary.helpers";

const beforeAfterString = (date: string) => {
  const daysSince = getDaysBetween(new Date(), new Date(date));

  return relativeTimeFormat.format(daysSince, "day");
};

export interface ConventionValidationProps {
  convention: ConventionReadDto;
  jwtParams: JwtKindProps;
  roles: Role[];
}

export const ConventionValidation = ({
  convention,
  jwtParams,
  roles,
}: ConventionValidationProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const assessment = useAppSelector(assessmentSelectors.currentAssessment);
  const [isAssessmentLinkSent, setIsAssessmentLinkSent] =
    useState<boolean>(false);

  useScrollToTop(
    useFeedbackTopics([
      "send-signature-link",
      "send-assessment-link",
      "convention-action-sign",
    ]).length > 0,
  );

  const [signatoryToSendSignatureLink, setSignatoryToSendSignatureLink] =
    useState<{
      signatoryRole: SignatoryRole;
      signatoryPhone: PhoneNumber;
    } | null>(null);

  const [signatureLinksSent, setSignatureLinksSent] =
    useState<SignatureLinkState>({
      beneficiary: false,
      "establishment-representative": false,
      "beneficiary-representative": false,
      "beneficiary-current-employer": false,
    });

  const isSignatureModalOpen = useIsModalOpen(sendSignatureLinkModal);

  useEffect(() => {
    if (!isSignatureModalOpen) setSignatoryToSendSignatureLink(null);
  }, [isSignatureModalOpen]);

  useEffect(() => {
    dispatch(
      assessmentSlice.actions.getAssessmentRequested({
        conventionId: convention.id,
        jwt: jwtParams.jwt,
        feedbackTopic: "assessment",
      }),
    );
  }, [dispatch, convention.id, jwtParams.jwt]);

  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const shouldShowAssessmentReminderButton =
    canAssessmentBeFilled(convention, assessment) &&
    !isConventionEndingInOneDayOrMore(convention) &&
    intersection(roles, [
      ...agencyModifierRoles,
      ...allSignatoryRoles,
      "back-office",
    ]).length > 0;

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

  const onSubmitSendAssessmentLink = () => {
    setIsAssessmentLinkSent(true);

    dispatch(
      sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested({
        conventionId: convention.id,
        jwt: jwtParams.jwt,
        feedbackTopic: "send-assessment-link",
      }),
    );
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
        topics={[
          "send-signature-link",
          "send-assessment-link",
          "convention-action-sign",
        ]}
        closable
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
          shouldShowAssessmentReminderButton
            ? sendAssessmentLinkButtonProps({
                isAssessmentLinkSent,
                onClick: () => {
                  sendAssessmentLinkModal.open();
                },
              })
            : undefined,
        )}
        conventionId={convention.id}
      />

      <SendSignatureLinkModalWrapper
        signatory={signatoryToSendSignatureLink?.signatoryRole}
        signatoryPhone={signatoryToSendSignatureLink?.signatoryPhone}
        onConfirm={onSubmitSendSignatureLink}
      />
      <SendAssessmentLinkModalWrapper
        phone={convention.establishmentTutor.phone}
        onConfirm={onSubmitSendAssessmentLink}
      />
    </>
  );
};
