import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { formatDistance } from "date-fns";
import { fr as french } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
} from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  ConventionReadDto,
  Phone,
  SignatoryRole,
  domElementIds,
  isConventionRenewed,
  isValidMobilePhone,
  signatoryTitleByRole,
  toDisplayedDate,
} from "shared";
import { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
import { Feedback } from "src/app/components/feedback/Feedback";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { remindSignatoriesSlice } from "src/core-logic/domain/convention/remind-signatories/remindSignatories.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { useStyles } from "tss-react/dsfr";
import { makeConventionSections } from "../../../contents/convention/conventionSummary.helpers";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: french,
  });
};

const remindBySmsModal = createModal({
  id: domElementIds.manageConvention.remindSignatoriesBySmsModal,
  isOpenedByDefault: false,
});

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
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const hasErrorFeedback = feedbacks["remind-signatories"]?.level === "error";

  const [signatoryToRemind, setSignatoryToRemind] = useState<{
    signatoryRole: SignatoryRole;
    signatoryPhone: Phone;
  } | null>(null);

  const closeRemindBySmsModalModal = () => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    remindBySmsModal.close();
  };

  const isModalOpen = useIsModalOpen(remindBySmsModal, {
    onConceal: () => closeRemindBySmsModalModal(),
  });

  useEffect(() => {
    if (!isModalOpen) setSignatoryToRemind(null);
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

  const onSubmitRemindSignatoryBySms = () => {
    if (signatoryToRemind)
      dispatch(
        remindSignatoriesSlice.actions.remindSignatoriesRequested({
          conventionId: convention.id,
          signatoryRole: signatoryToRemind.signatoryRole,
          jwt: jwtParams.jwt,
          feedbackTopic: "remind-signatories",
        }),
      );
  };

  const openRemindBySmsButtonProps: (
    signatoryRole: SignatoryRole,
    signatoryPhone: Phone,
    signatoryAlreadySign: boolean,
  ) => ButtonProps = (signatoryRole, signatoryPhone, signatoryAlreadySign) => {
    return {
      priority: "tertiary",
      children: "Faire signer par SMS",
      disabled: !isValidMobilePhone(signatoryPhone) || signatoryAlreadySign,
      onClick: () => {
        remindBySmsModal.open();
        setSignatoryToRemind({ signatoryRole, signatoryPhone });
      },

      id: domElementIds.manageConvention.openRemindSignatoriesBySmsModal,
    };
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
      <h3>{title}</h3>
      {convention.statusJustification && (
        <p>Justification : {convention.statusJustification}</p>
      )}
      {isConventionRenewed(convention) && (
        <ConventionRenewedInformations renewed={convention.renewed} />
      )}
      <ConventionSummary
        submittedAt={toDisplayedDate({
          date: new Date(convention.dateSubmission),
        })}
        summary={makeConventionSections(convention, openRemindBySmsButtonProps)}
        conventionId={convention.id}
      />

      {createPortal(
        <remindBySmsModal.Component title="Envoyer le lien de signature par SMS">
          <p>
            Le{" "}
            {signatoryToRemind &&
              signatoryTitleByRole[signatoryToRemind.signatoryRole]}{" "}
            recevra un lien de signature au {signatoryToRemind?.signatoryPhone}
          </p>

          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="right"
            buttons={[
              {
                priority: "secondary",
                children: "Annuler",
                onClick: () => {
                  remindBySmsModal.close();
                },
              },
              {
                id: domElementIds.manageConvention
                  .submitRemindSignatoriesBySmsModalButton,
                priority: "primary",
                children: "Envoyer",
                disabled: hasErrorFeedback,
                onClick: () => onSubmitRemindSignatoryBySms(),
              },
            ]}
          />
          <Feedback topic="remind-signatories" className={fr.cx("fr-my-2w")} />
        </remindBySmsModal.Component>,
        document.body,
      )}
    </>
  );
};
