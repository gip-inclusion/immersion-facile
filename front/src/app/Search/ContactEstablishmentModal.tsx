import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
} from "@dataesr/react-dsfr";
import React, { useEffect, useReducer } from "react";
import { ContactByEmail } from "src/app/Search/ContactByEmail";
import { Button } from "src/components/Button";
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
};

export const ContactEstablishmentModal = ({
  modalState,
  dispatch,
}: ContactEstablishmentModalProps) => {
  const hide = () => dispatch({ type: "CLICKED_CLOSE" });

  return (
    <Modal isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Close the modal window" />
      <ModalTitle icon="ri-arrow-right-fill">Modal Title</ModalTitle>
      <ModalContent>
        <ModalContactContent modalState={modalState} hide={hide} />
      </ModalContent>
    </Modal>
  );
};

type ModalContactContentProps = {
  modalState: ModalState;
  hide: () => void;
};

const ModalContactContent = ({
  modalState,
  hide,
}: ModalContactContentProps) => {
  switch (modalState.contactMethod) {
    case "EMAIL":
      return (
        <ContactByEmail
          immersionOfferId={modalState.immersionOfferId}
          closeModal={hide}
        />
      );
    case "PHONE":
      return <ContactByPhone />;
    case "IN_PERSON":
      return <ContactInPerson />;
    default:
      return <div>Aucun contact trouvé pour cette entreprise</div>;
  }
};

const ContactByPhone = () => {
  return <div>TODO : Contacter par téléphone</div>;
};

const ContactInPerson = () => {
  return <div>TODO : Rencontrer en personne</div>;
};
