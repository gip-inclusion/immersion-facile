import {
  Modal,
  ModalClose,
  ModalContent,
} from "@dataesr/react-dsfr";
import React, { useReducer } from "react";

type ModalState = {
  isOpen: boolean;
};

type ModalAction = { type: "CLICKED_OPEN" } | { type: "CLICKED_CLOSE" };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "CLICKED_OPEN":
      return { ...state, isOpen: true };
    case "CLICKED_CLOSE":
      return { isOpen: false };
    default:
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
  }
};

export const useElementContainerModal = () => {
  const initialModalState: ModalState = {
    isOpen: false,
  };

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);
  return { modalState, dispatch };
};

type ElementContainerModalProps = {
  modalState: ModalState;
  dispatch: React.Dispatch<ModalAction>;
  children: React.ReactNode;
};

export const ElementModalContainer = ({
  modalState,
  dispatch,
  children,
}: ElementContainerModalProps) => {
  const hide = () => dispatch({ type: "CLICKED_CLOSE" });
  return (
    <Modal isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Close the modal window" />
      <ModalContent>{children}</ModalContent>
    </Modal>
  );
};
