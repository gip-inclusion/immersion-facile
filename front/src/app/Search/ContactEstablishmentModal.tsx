import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
} from "@dataesr/react-dsfr";
import React, { useEffect, useReducer } from "react";
import { Button } from "src/components/Button";
import {
  ContactMethod,
  ImmersionContactInEstablishmentId,
} from "src/shared/FormEstablishmentDto";

type ModalState = {
  isOpen: boolean;
  isValidating: boolean;
  contactId?: ImmersionContactInEstablishmentId;
  contactMethod?: ContactMethod;
};

type ModalAction =
  | {
      type: "CLICKED_OPEN";
      payload: {
        contactId?: ImmersionContactInEstablishmentId;
        contactMethod?: ContactMethod;
      };
    }
  | { type: "CLICKED_CLOSE" }
  | { type: "CLICKED_VALIDATE" }
  | { type: "VALIDATION_HANDLED" };

const initialModalState: ModalState = {
  isOpen: false,
  isValidating: false,
};

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "CLICKED_OPEN":
      return { ...state, isOpen: true, ...action.payload };
    case "CLICKED_CLOSE":
      return { isOpen: false, isValidating: false };
    case "CLICKED_VALIDATE":
      return { ...state, isOpen: false, isValidating: true };
    case "VALIDATION_HANDLED":
      return { isOpen: false, isValidating: false };
    default:
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
  }
};

export const useContactEstablishmentModal = () => {
  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  useEffect(() => {
    if (modalState.isValidating) {
      switch (modalState.contactMethod) {
        case "EMAIL":
          // TODO : call back , and then dispatch({type: "VALIDATION_HANDLED"})
          break;
        case "PHONE":
          // TODO : call back , and then dispatch({type: "VALIDATION_HANDLED"})
          break;
        case "IN_PERSON":
          // TODO : call back , and then dispatch({type: "VALIDATION_HANDLED"})
          break;
        default:
        // TODO : what should we do ? then dispatch({type: "VALIDATION_HANDLED"})
      }
    }
  }, [modalState.isValidating]);

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
        <p>Contact ID: {modalState.contactId}</p>
        <ModalContactContent modalState={modalState} />
      </ModalContent>
      <ModalFooter>
        <Button
          level="secondary"
          onSubmit={() => dispatch({ type: "CLICKED_VALIDATE" })}
        >
          Modal Button
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const ModalContactContent = ({ modalState }: { modalState: ModalState }) => {
  switch (modalState.contactMethod) {
    case "EMAIL":
      return <ContactByEmail />;
    case "PHONE":
      return <ContactByPhone />;
    case "IN_PERSON":
      return <ContactInPerson />;
    default:
      return <div>Aucun contact trouvé pour cette entreprise</div>;
  }
};

const ContactByEmail = () => {
  return <div>TODO : Contacter par email</div>;
};

const ContactByPhone = () => {
  return <div>TODO : Contacter par téléphone</div>;
};

const ContactInPerson = () => {
  return <div>TODO : Rencontrer en personne</div>;
};
