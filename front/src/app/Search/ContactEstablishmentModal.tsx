import {
  Modal,
  ModalClose,
  ModalContent,
  ModalTitle,
} from "@dataesr/react-dsfr";
import React, { useReducer } from "react";
import { ContactByEmail } from "src/app/Search/ContactByEmail";
import { ContactByPhone } from "src/app/Search/ContactByPhone";
import {
  ContactMethod,
  ImmersionContactInEstablishmentId,
} from "src/shared/FormEstablishmentDto";
import { ImmersionOfferId } from "src/shared/SearchImmersionDto";

type ModalState = {
  isOpen: boolean;
  isValidating: boolean;
  contactId?: ImmersionContactInEstablishmentId;
  immersionOfferId: ImmersionOfferId;
  contactMethod?: ContactMethod;
};

type ModalAction =
  | {
      type: "CLICKED_OPEN";
      payload: {
        immersionOfferId: ImmersionOfferId;
        contactId?: ImmersionContactInEstablishmentId;
        contactMethod?: ContactMethod;
      };
    }
  | { type: "CLICKED_CLOSE" }
  | { type: "CLICKED_VALIDATE" }
  | { type: "VALIDATION_HANDLED" };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "CLICKED_OPEN":
      return { ...state, isOpen: true, ...action.payload };
    case "CLICKED_CLOSE":
      return { immersionOfferId: "", isOpen: false, isValidating: false };
    case "CLICKED_VALIDATE":
      return { ...state, isOpen: false, isValidating: true };
    case "VALIDATION_HANDLED":
      return { immersionOfferId: "", isOpen: false, isValidating: false };
    default:
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
  }
};

export const useContactEstablishmentModal = () => {
  const initialModalState: ModalState = {
    immersionOfferId: "",
    isOpen: false,
    isValidating: false,
  };

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  return { modalState, dispatch };
};

type ContactEstablishmentModalProps = {
  modalState: ModalState;
  dispatch: React.Dispatch<ModalAction>;
  onSuccess: () => void;
};

export const ContactEstablishmentModal = ({
  modalState,
  dispatch,
  onSuccess,
}: ContactEstablishmentModalProps) => {
  const hide = () => dispatch({ type: "CLICKED_CLOSE" });

  const hideAndShowSuccess = () => {
    hide();
    onSuccess();
  };

  return (
    <Modal isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Close the modal window" />
      <ModalTitle icon="ri-arrow-right-fill">Contacter l'entreprise</ModalTitle>
      <ModalContent>
        <ModalContactContent
          modalState={modalState}
          onSuccess={hideAndShowSuccess}
        />
      </ModalContent>
    </Modal>
  );
};

type ModalContactContentProps = {
  modalState: ModalState;
  onSuccess: () => void;
};

const ModalContactContent = ({
  modalState,
  onSuccess,
}: ModalContactContentProps) => {
  switch (modalState.contactMethod) {
    case "EMAIL":
      return (
        <ContactByEmail
          immersionOfferId={modalState.immersionOfferId}
          onSuccess={onSuccess}
        />
      );
    case "PHONE":
      return (
        <ContactByPhone
          immersionOfferId={modalState.immersionOfferId}
          onSuccess={onSuccess}
        />
      );
    default:
      return <AdvisesForContact />;
  }
};

const AdvisesForContact = () => {
  return (
    <div>Conseils pour rencontrer l'entreprise: TODO ajouter les conseils</div>
  );
};
