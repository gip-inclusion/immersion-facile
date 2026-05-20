import type { ModalProps } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type ComponentType, type ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import {
  isValidMobilePhone,
  type NotificationKind,
  type PhoneNumber,
} from "shared";
import mushroomIllustration from "src/assets/img/mushroom.webp";
import shurikenIllustration from "src/assets/img/shuriken.webp";

type ReminderModal = {
  Component: ComponentType<ModalProps>;
  close: () => void;
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
}: SendReminderModalProps) => {
  const [notificationKind, setNotificationKind] = useState<
    NotificationKind | undefined
  >();
  const hasMobilePhone = !!phone?.trim() && isValidMobilePhone(phone);
  const selectedNotificationKind = hasMobilePhone ? notificationKind : "email";

  const handleCancel = () => {
    onCancel?.();
    modal.close();
  };

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
          disabled: !selectedNotificationKind || isSubmitDisabled,
          onClick: () =>
            selectedNotificationKind && onConfirm(selectedNotificationKind),
        },
      ]}
    >
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
              hintText:
                "Le SMS est généralement plus rapide et évite les problèmes de réception d’email (spam, filtres type Mailinblack, …).",
              nativeInputProps: {
                value: "sms",
                checked: notificationKind === "sms",
                onChange: () => setNotificationKind("sms"),
              },
            },
            {
              illustration: <img src={mushroomIllustration} alt="" />,
              label: `Email: ${email}`,
              hintText:
                "Par défaut, nos communications et rappels sont envoyés par email.",
              nativeInputProps: {
                value: "email",
                checked: notificationKind === "email",
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
              hintText:
                "Aucun numéro de mobile n'a été renseigné pour cette personne.",
              nativeInputProps: {
                value: "email",
                checked: true,
                onChange: () => setNotificationKind("email"),
              },
            },
          ]}
        />
      )}
    </modal.Component>,
    document.body,
  );
};
