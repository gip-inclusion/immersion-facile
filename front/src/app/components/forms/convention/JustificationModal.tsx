import { Form, Formik } from "formik";
import React from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
  ModalTitle,
} from "react-design-system";
import {
  ConventionStatusWithJustification,
  domElementIds,
  UpdateConventionStatusRequestDto,
  WithJustification,
  withJustificationSchema,
} from "shared";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { fr } from "@codegouvfr/react-dsfr";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

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
        <ModalTitle>{title}</ModalTitle>
        {newStatus === "DRAFT" && (
          <Alert
            severity="warning"
            title="Attention !"
            className={fr.cx("fr-mb-2w")}
            description="Ne surtout pas demander de modification si une signature manque !
            Cela revient à annuler les signatures déjà enregistrées. Pour
            relancer un signataire manquant, le contacter par mail."
          />
        )}
        {newStatus === "REJECTED" && (
          <Alert
            severity="warning"
            title="Attention !"
            className={fr.cx("fr-mb-2w")}
            description="Ne surtout pas refuser une immersion si une signature manque ! Cela
          revient à annuler les signatures déjà enregistrées. Pour relancer un
          signataire manquant, le contacter par mail."
          />
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
            <ButtonsGroup
              alignment="center"
              inlineLayoutWhen="always"
              buttons={[
                {
                  type: "button",
                  priority: "secondary",
                  onClick: closeModal,
                  nativeButtonProps: {
                    id: domElementIds.manageConvention
                      .justificationModalCancelButton,
                  },
                  children: "Annuler",
                },
                {
                  type: "submit",
                  nativeButtonProps: {
                    id: domElementIds.manageConvention
                      .justificationModalSubmitButton,
                  },
                  children: "Envoyer",
                },
              ]}
            />
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
