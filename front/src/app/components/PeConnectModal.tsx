import React, { useReducer } from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
  Title,
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
    <ModalDialog isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Fermer la fenêtre" />
      <ModalContent className={"fr-modal__content-inner"}>
        <Title>Accès au formulaire de demande de convention</Title>
        <InitiateConventionCard
          title="Accès au formulaire de demande de convention"
          peConnectNotice="Je suis demandeur d’emploi et je connais mes identifiants à mon compte Pôle emploi. J'accède au formulaire ici :"
          otherCaseNotice="<strong>Je suis dans une autre situation</strong><br/>(candidat à une immersion sans identifiant Pôle emploi, entreprise ou conseiller emploi).<br/>J'accède au formulaire partagé ici :"
          showFormButtonLabel="Ouvrir le formulaire"
          useSection={false}
        />
      </ModalContent>
    </ModalDialog>
  );
};
