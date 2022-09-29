import React, { useReducer } from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
} from "react-design-system/immersionFacile";
import ModalTitle from "src/app/pages/Convention/ModalTitleOverride";

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
    default: {
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
    }
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
  title?: string;
};

export const ElementModalContainer = ({
  modalState,
  dispatch,
  children,
  title,
}: ElementContainerModalProps) => {
  const hide = () => dispatch({ type: "CLICKED_CLOSE" });
  return (
    <ModalDialog isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Close the modal window" />
      {title && (
        <ModalTitle
          className={
            "h-6 top-0 text-immersionBlue-dark font-semibold text-lg z-10"
          }
        >
          {title}
        </ModalTitle>
      )}
      <ModalContent>{children}</ModalContent>
    </ModalDialog>
  );
};
