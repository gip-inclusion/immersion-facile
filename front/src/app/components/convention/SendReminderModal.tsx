import type { ModalProps } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type ComponentType, type ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import {
  CONVENTION_MANUAL_REMINDER_COOLDOWN_IN_HOURS,
  type DateTimeIsoString,
  formatHoursCooldownTimeRemaining,
  isValidMobilePhone,
  isWithinHoursCooldown,
  type LastReminderDateByNotificationKind,
  type NotificationKind,
  type PhoneNumber,
  toDisplayedDate,
} from "shared";
import mushroomIllustration from "src/assets/img/mushroom.webp";
import shurikenIllustration from "src/assets/img/shuriken.webp";

type ReminderModal = {
  Component: ComponentType<ModalProps>;
  close: () => void;
};

const formatBlockedReminderMessage = (
  lastSentAt: DateTimeIsoString,
  now: Date,
  recipientFullName?: string,
) => {
  const lastActionAt = new Date(lastSentAt);
  const recipientPart = recipientFullName ? `à ${recipientFullName} ` : "";

  return `Une relance a déjà été envoyée ${recipientPart}le ${toDisplayedDate({
    date: lastActionAt,
    withHours: true,
  })}. Afin d’éviter les envois excessifs, vous ne pourrez effectuer un nouvel envoi que dans ${formatHoursCooldownTimeRemaining(
    {
      lastActionAt,
      minHours: CONVENTION_MANUAL_REMINDER_COOLDOWN_IN_HOURS,
      now,
    },
  )}.`;
};

const getFirstChannelAvailableAgainLastSentAt = ({
  emailLastSentAt,
  smsLastSentAt,
}: {
  emailLastSentAt: DateTimeIsoString;
  smsLastSentAt?: DateTimeIsoString | null;
}): DateTimeIsoString => {
  if (smsLastSentAt) {
    if (new Date(emailLastSentAt) <= new Date(smsLastSentAt))
      return emailLastSentAt;

    return smsLastSentAt;
  }

  return emailLastSentAt;
};

export type SendReminderModalProps = {
  modal: ReminderModal;
  title: string;
  description: ReactNode;
  phone: PhoneNumber;
  email: string;
  radioGroupId: string;
  radioGroupName: string;
  submitButtonId?: string;
  onConfirm: (notificationKind: NotificationKind) => void;
  onCancel?: () => void;
  emailOnlyLegend?: string;
  isSubmitDisabled?: boolean;
  lastReminderDateByNotificationKind?: LastReminderDateByNotificationKind;
  recipientFullName?: string;
};

export const SendReminderModal = ({
  modal,
  title,
  description,
  phone,
  email,
  radioGroupId,
  radioGroupName,
  submitButtonId,
  onConfirm,
  onCancel,
  emailOnlyLegend,
  isSubmitDisabled = false,
  lastReminderDateByNotificationKind,
  recipientFullName,
}: SendReminderModalProps) => {
  const [notificationKind, setNotificationKind] = useState<
    NotificationKind | undefined
  >();
  const now = new Date();
  const hasMobilePhone = !!phone?.trim() && isValidMobilePhone(phone);
  const isEmailDisabled =
    !!lastReminderDateByNotificationKind?.email &&
    isWithinHoursCooldown({
      lastActionAt: new Date(lastReminderDateByNotificationKind.email),
      minHours: CONVENTION_MANUAL_REMINDER_COOLDOWN_IN_HOURS,
      now,
    });

  const isSmsDisabled =
    !!lastReminderDateByNotificationKind?.sms &&
    isWithinHoursCooldown({
      lastActionAt: new Date(lastReminderDateByNotificationKind.sms),
      minHours: CONVENTION_MANUAL_REMINDER_COOLDOWN_IN_HOURS,
      now,
    });

  const isAllChannelsBlocked = hasMobilePhone
    ? isEmailDisabled && isSmsDisabled
    : isEmailDisabled;

  const emailLastSentAt = lastReminderDateByNotificationKind?.email;

  const handleCancel = () => {
    setNotificationKind(undefined);
    onCancel?.();
    modal.close();
  };

  const emailHintText =
    hasMobilePhone &&
    isEmailDisabled !== isSmsDisabled &&
    isEmailDisabled &&
    lastReminderDateByNotificationKind?.email
      ? formatBlockedReminderMessage(
          lastReminderDateByNotificationKind.email,
          now,
        )
      : "Par défaut, nos communications et rappels sont envoyés par email.";

  const smsHintText =
    hasMobilePhone &&
    isEmailDisabled !== isSmsDisabled &&
    isSmsDisabled &&
    lastReminderDateByNotificationKind?.sms
      ? formatBlockedReminderMessage(
          lastReminderDateByNotificationKind.sms,
          now,
        )
      : "Le SMS est généralement plus rapide et évite les problèmes de réception d’email (spam, filtres type Mailinblack, …).";

  const selectedNotificationKind = hasMobilePhone ? notificationKind : "email";
  const isSelectedChannelDisabled =
    (selectedNotificationKind === "email" && isEmailDisabled) ||
    (selectedNotificationKind === "sms" && isSmsDisabled);

  return createPortal(
    <modal.Component
      title={title}
      buttons={[
        {
          priority: "secondary",
          children: "Annuler",
          onClick: handleCancel,
        },
        {
          id: submitButtonId,
          priority: "primary",
          children: "Envoyer la relance",
          disabled:
            isAllChannelsBlocked ||
            !selectedNotificationKind ||
            isSelectedChannelDisabled ||
            isSubmitDisabled,
          onClick: () =>
            selectedNotificationKind &&
            !isSelectedChannelDisabled &&
            onConfirm(selectedNotificationKind),
        },
      ]}
    >
      {isAllChannelsBlocked && emailLastSentAt ? (
        <p>
          {formatBlockedReminderMessage(
            getFirstChannelAvailableAgainLastSentAt({
              emailLastSentAt,
              smsLastSentAt: lastReminderDateByNotificationKind?.sms,
            }),
            now,
            recipientFullName,
          )}
        </p>
      ) : (
        <>
          {description}
          {hasMobilePhone ? (
            <RadioButtons
              id={radioGroupId}
              legend={
                "Choisissez le canal par lequel vous souhaitez lui envoyer un rappel."
              }
              name={radioGroupName}
              options={[
                {
                  illustration: <img src={shurikenIllustration} alt="" />,
                  label: `SMS: ${phone}`,
                  hintText: smsHintText,
                  nativeInputProps: {
                    value: "sms",
                    checked: notificationKind === "sms",
                    disabled: isSmsDisabled,
                    onChange: () => setNotificationKind("sms"),
                  },
                },
                {
                  illustration: <img src={mushroomIllustration} alt="" />,
                  label: `Email: ${email}`,
                  hintText: emailHintText,
                  nativeInputProps: {
                    value: "email",
                    checked: notificationKind === "email",
                    disabled: isEmailDisabled,
                    onChange: () => setNotificationKind("email"),
                  },
                },
              ]}
            />
          ) : (
            <RadioButtons
              id={radioGroupId}
              legend={emailOnlyLegend}
              name={radioGroupName}
              options={[
                {
                  illustration: <img src={mushroomIllustration} alt="" />,
                  label: `Un rappel sera envoyé par email à l’adresse : ${email}`,
                  hintText: emailHintText,
                  nativeInputProps: {
                    value: "email",
                    checked: true,
                    disabled: isEmailDisabled,
                    onChange: () => setNotificationKind("email"),
                  },
                },
              ]}
            />
          )}
        </>
      )}
    </modal.Component>,
    document.body,
  );
};
