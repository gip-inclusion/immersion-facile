import React, { useEffect, useReducer } from "react";
import {
  ModalClose,
  ModalContent,
  ModalDialog,
  ModalTitle,
} from "react-design-system";
import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";
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

const contents: Record<ActionOnEstablishment, Record<string, string>> = {
  edit: {
    title: "Modifier ma fiche entreprise",
    subtitle: "Pour modifier votre fiche, veuillez entrer votre SIRET",
  },
  register: {
    title: "Enregistrer mon entreprise",
    subtitle: "Pour enregistrer votre entreprise, veuillez entrer votre SIRET",
  },
};

export const SiretModal = ({ modalState, dispatch }: SiretModalProps) => {
  const { clearSiret } = useEstablishmentSiret({
    shouldFetchEvenIfAlreadySaved: false,
  });
  const hide = () => {
    clearSiret();
    dispatch({ type: "CLICKED_CLOSE" });
  };
  useEffect(() => {
    clearSiret();
  }, []);

  const getModalContents = (mode: ActionOnEstablishment) => contents[mode];
  return (
    <ModalDialog isOpen={modalState.isOpen} hide={hide} size="sm">
      <ModalClose hide={hide} title="Fermer la fenêtre" />
      <ModalContent>
        <ModalTitle>{getModalContents(modalState.mode).title}</ModalTitle>
        <p>{getModalContents(modalState.mode).subtitle}</p>
        <SiretFetcherInput
          placeholder="Entrez le Siret de votre entreprise"
          shouldFetchEvenIfAlreadySaved={false}
        />
      </ModalContent>
    </ModalDialog>
  );
};
