import React, { useReducer } from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
  SubTitle,
  Title,
} from "react-design-system/immersionFacile";
import { SiretFetcherInput } from "./SiretFetcherInput";

type ActionOnEstablishment = "register" | "edit";

type ModalState = {
  isOpen: boolean;
  mode: "register" | "edit";
};

type ModalAction =
  | {
      type: "CLICKED_OPEN";
      payload: {
        mode: ActionOnEstablishment;
      };
    }
  | { type: "CLICKED_CLOSE" };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "CLICKED_OPEN":
      return { ...state, isOpen: true, ...action.payload };
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

export const useSiretModal = () => {
  const initialModalState: ModalState = {
    mode: "register",
    isOpen: false,
  };

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  return { modalState, dispatch };
};

type SiretModalProps = {
  modalState: ModalState;
  dispatch: React.Dispatch<ModalAction>;
};

export const SiretModal = ({ modalState, dispatch }: SiretModalProps) => {
  const hide = () => dispatch({ type: "CLICKED_CLOSE" });
  const contents: Record<ActionOnEstablishment, Record<string, string>> = {
    edit: {
      title: "Editer mon entreprise",
      subtitle: "Pour éditer votre entreprise, veuillez entrer votre SIRET",
    },
    register: {
      title: "Enregistrer mon entreprise",
      subtitle:
        "Pour enregistrer votre entreprise, veuillez entrer votre SIRET",
    },
  };
  const getModalContents = (mode: ActionOnEstablishment) => contents[mode];
  return (
    <ModalDialog isOpen={modalState.isOpen} hide={hide}>
      <ModalClose hide={hide} title="Fermer la fenêtre" />
      <ModalContent>
        <Title>{getModalContents(modalState.mode).title}</Title>
        <SubTitle>{getModalContents(modalState.mode).subtitle}</SubTitle>
        <div className="fr-grid-row fr-grid-row--center">
          <SiretFetcherInput
            placeholder="Entrez le Siret de votre entreprise"
            shouldFetchEvenIfAlreadySaved={false}
          />
        </div>
      </ModalContent>
    </ModalDialog>
  );
};
