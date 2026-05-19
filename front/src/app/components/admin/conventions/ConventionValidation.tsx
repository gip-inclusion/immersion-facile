import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { intersection } from "ramda";
import { useEffect, useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
  useScrollTo,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  agencyModifierRoles,
  allSignatoryRoles,
  type ConventionReadDto,
  conventionSignatoryRoleBySignatoryKey,
  getDaysBetween,
  isConventionRenewed,
  isConventionValidated,
  type NotificationKind,
  type Role,
  relativeTimeFormat,
  type Signatory,
  type SignatoryRole,
  toDisplayedDate,
} from "shared";
import type { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
import { Feedback } from "src/app/components/feedback/Feedback";
import { hasUserRightsOnAgencyBroadcast } from "src/app/components/forms/convention/manage-actions/getButtonConfigBySubStatus";
import { SubscriberErrorFeedbackComponent } from "src/app/components/SubscriberErrorFeedback";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useFeedbackTopics } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  getAssessmentCompletionStatus,
  getAssessmentLabelsAndSeverityByStatus,
} from "src/app/utils/assessment.utils";
import { commonIllustrations } from "src/assets/img/illustrations";
import { sendAssessmentLinkSlice } from "src/core-logic/domain/assessment/send-assessment-link/sendAssessmentLink.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import {
  canAssessmentBeFilled,
  isConventionEndingInOneDayOrMore,
} from "src/core-logic/domain/convention/convention.utils";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { partnersErroredConventionSelectors } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.selectors";
import {
  makeConventionSections,
  SendAssessmentLinkModalWrapper,
  SendSignatureLinkModalWrapper,
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
  const dispatch = useDispatch();
  const conventionLastBroadcastFeedback = useAppSelector(
    partnersErroredConventionSelectors.lastBroadcastFeedback,
  );
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const [isAssessmentLinkSent, setIsAssessmentLinkSent] =
    useState<boolean>(false);

  useScrollTo(
    useFeedbackTopics([
      "send-signature-link",
      "send-assessment-link",
      "convention-action-sign",
    ]).length > 0,
  );

  const [signatoryToSendSignatureLink, setSignatoryToSendSignatureLink] =
    useState<Signatory | null>(null);

  const isSignatureModalOpen = useIsModalOpen(sendSignatureLinkModal);

  useEffect(() => {
    if (!isSignatureModalOpen) setSignatoryToSendSignatureLink(null);
  }, [isSignatureModalOpen]);

  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const shouldShowAssessmentReminderButton =
    canAssessmentBeFilled(convention) &&
    !isConventionEndingInOneDayOrMore(convention) &&
    intersection(roles, [
      ...agencyModifierRoles,
      ...allSignatoryRoles,
      "back-office",
    ]).length > 0;

  const shouldShowConventionLastBroadcastFeedbackErrorInfo =
    conventionLastBroadcastFeedback?.subscriberErrorFeedback &&
    intersection(roles, [...agencyModifierRoles, "back-office"]).length > 0 &&
    currentUser &&
    hasUserRightsOnAgencyBroadcast(currentUser);
  const shouldShowAssessmentBadge = isConventionValidated(convention);
  const title = `${beneficiary.lastName.toUpperCase()} ${
    beneficiary.firstName
  } chez ${businessName} ${beforeAfterString(dateStart)}`;

  const onSubmitSendSignatureLink = ({
    notificationKind,
    signatoryRole,
  }: {
    notificationKind: NotificationKind;
    signatoryRole: SignatoryRole;
  }) => {
    dispatch(
      sendSignatureLinkSlice.actions.sendSignatureLinkRequested({
        conventionId: convention.id,
        signatoryRole,
        notificationKind,
        jwt: jwtParams.jwt,
        feedbackTopic: "send-signature-link",
      }),
    );
  };

  const onSubmitSendAssessmentLink = (notificationKind: NotificationKind) => {
    setIsAssessmentLinkSent(true);

    dispatch(
      sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested({
        conventionId: convention.id,
        notificationKind,
        jwt: jwtParams.jwt,
        feedbackTopic: "send-assessment-link",
      }),
    );
  };

  return (
    <>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mb-3w")}>
        <Badge
          className={`${fr.cx("fr-mr-2w")} ${labelAndSeverityByStatus[status].color}`}
        >
          {labelAndSeverityByStatus[status].label}
        </Badge>
        {shouldShowConventionLastBroadcastFeedbackErrorInfo && (
          <Badge className={fr.cx("fr-mr-2w")} severity="error">
            Erreur de synchronisation
          </Badge>
        )}
        {shouldShowAssessmentBadge && (
          <Badge
            className={fr.cx("fr-mr-2w")}
            severity={
              getAssessmentLabelsAndSeverityByStatus({ isPlural: false })[
                getAssessmentCompletionStatus(convention.assessment)
              ].severity
            }
          >
            {
              getAssessmentLabelsAndSeverityByStatus({ isPlural: false })[
                getAssessmentCompletionStatus(convention.assessment)
              ].shortLabel
            }
          </Badge>
        )}
      </div>
      <h1 className={fr.cx("fr-h3")}>{title}</h1>
      {convention.statusJustification && (
        <p>Justification : {convention.statusJustification}</p>
      )}

      {shouldShowConventionLastBroadcastFeedbackErrorInfo &&
        conventionLastBroadcastFeedback.subscriberErrorFeedback && (
          <SubscriberErrorFeedbackComponent
            subscriberErrorFeedback={
              conventionLastBroadcastFeedback?.subscriberErrorFeedback
            }
            conventionStatus={convention.status}
          />
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

      {convention.isEstablishmentBanned && !convention.dateValidation && (
        <Alert
          severity="error"
          description="L’entreprise liée à cette convention a été bannie d’Immersion Facilitée suite à des signalements. Nous vous recommandons de ne pas valider cette convention."
          small
          className={fr.cx("fr-mb-5v")}
        />
      )}

      <ConventionSummary
        illustration={commonIllustrations.documentsAdministratifs}
        submittedAt={toDisplayedDate({
          date: new Date(convention.dateSubmission),
        })}
        summary={makeConventionSections(
          convention,
          sendSignatureLinkButtonProps({
            onClick: ({ signatoryRole, signatoryPhone, signatoryEmail }) => {
              const signatoryKey =
                conventionSignatoryRoleBySignatoryKey[signatoryRole];
              const selectedSignatory = convention.signatories[signatoryKey];
              if (!selectedSignatory) return;
              setSignatoryToSendSignatureLink({
                role: signatoryRole,
                phone: signatoryPhone,
                email: signatoryEmail,
                firstName: selectedSignatory.firstName,
                lastName: selectedSignatory.lastName,
              });
              sendSignatureLinkModal.open();
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
        signatory={signatoryToSendSignatureLink ?? undefined}
        onConfirm={onSubmitSendSignatureLink}
      />
      <SendAssessmentLinkModalWrapper
        phone={convention.establishmentTutor.phone}
        email={convention.establishmentTutor.email}
        onConfirm={onSubmitSendAssessmentLink}
      />
    </>
  );
};
