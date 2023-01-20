import React, { useReducer } from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
  ModalTitle,
} from "react-design-system/immersionFacile";
import { InitiateConventionCard } from "./InitiateConventionCard";

type ModalState = {
  isOpen: boolean;
};

type ModalAction =
  | {
      type: "CLICKED_OPEN";
    }
  | { type: "CLICKED_CLOSE" };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "CLICKED_OPEN":
      return { ...state, isOpen: true };
    case "CLICKED_CLOSE":
      return {
        ...state,
        isOpen: false,
      };
    default: {
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
    }
  }
};

export const usePeConnectModal = () => {
  const initialModalState: ModalState = {
    isOpen: false,
  };

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  return { modalState, dispatch };
};

type PeConnectModalProps = {
  modalState: ModalState;
  dispatch: React.Dispatch<ModalAction>;
};

export const PeConnectModal = ({
  modalState,
  dispatch,
}: PeConnectModalProps) => {
  const hide = () => {
    dispatch({ type: "CLICKED_CLOSE" });
  };

  return (
    <ModalDialog isOpen={modalState.isOpen} hide={hide} size="sm">
      <ModalClose hide={hide} title="Fermer la fenêtre" />
      <ModalContent className={["fr-modal__content-inner"]}>
        <ModalTitle>Activer une demande de convention</ModalTitle>
        <InitiateConventionCard
          title="Activer une demande de convention"
          peConnectNotice="Je suis accompagné(e) par<br/>
          Pôle Emploi ou en cours d’inscription"
          otherCaseNotice="Je suis accompagné(e) par<br/>
          une autre structure"
          showFormButtonLabel="Ouvrir le formulaire"
          useSection={false}
        />
      </ModalContent>
    </ModalDialog>
  );
};
