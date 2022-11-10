import { Form, Formik } from "formik";
import React from "react";
import {
  Button,
  ButtonGroup,
  ModalClose,
  ModalContent,
  ModalDialog,
  Notification,
  Title,
} from "react-design-system";
import {
  ConventionStatusWithJustification,
  UpdateConventionStatusRequestDto,
  WithJustification,
  withJustificationSchema,
} from "shared";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type JustificationModalProps = {
  title: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (p: boolean) => void;
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  newStatus: ConventionStatusWithJustification;
};

export const JustificationModal = ({
  title,
  setIsOpen,
  isOpen,
  onSubmit,
  newStatus,
}: JustificationModalProps) => {
  const closeModal = () => setIsOpen(false);
  const name: keyof WithJustification = "justification";

  return (
    <ModalDialog isOpen={isOpen} hide={closeModal}>
      <ModalClose hide={closeModal} title="Close the modal window" />
      <ModalContent>
        <Title>{title}</Title>
        {newStatus === "DRAFT" && (
          <Notification
            title={"Attention !"}
            type={"warning"}
            className="fr-mb-2w"
          >
            Ne surtout pas demander de modification si une signature manque !
            Cela revient à annuler les signatures déjà enregistrées. Pour
            relancer un signataire manquant, le contacter par mail.
          </Notification>
        )}
        <Formik
          initialValues={{ justification: "" }}
          validationSchema={toFormikValidationSchema(withJustificationSchema)}
          onSubmit={(values) => {
            onSubmit({ ...values, status: newStatus });
            closeModal();
          }}
        >
          <Form>
            <TextInput
              multiline={true}
              label={inputLabelByStatus[newStatus]}
              name={name}
            />
            <ButtonGroup className="fr-btns-group--inline-md fr-btns-group--center">
              <Button type="button" level={"secondary"} onSubmit={closeModal}>
                Annuler
              </Button>
              <Button type="submit">Envoyer</Button>
            </ButtonGroup>
          </Form>
        </Formik>
      </ModalContent>
    </ModalDialog>
  );
};

const inputLabelByStatus: Record<ConventionStatusWithJustification, string> = {
  DRAFT: "Précisez la raison et la modification nécessaire",
  REJECTED: "Pourquoi l'immersion est-elle refusée ?",
};
