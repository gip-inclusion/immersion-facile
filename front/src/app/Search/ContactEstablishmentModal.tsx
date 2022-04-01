import { Modal, ModalClose, ModalContent } from "@dataesr/react-dsfr";
import React, { ReactNode, useReducer } from "react";
import { ContactByEmail } from "src/app/Search/ContactByEmail";
import { ContactByPhone } from "src/app/Search/ContactByPhone";
import { SubTitle, Title } from "src/components/Title";
import {
  ContactMethod,
  ImmersionContactInEstablishmentId,
} from "src/shared/formEstablishment/FormEstablishment.dto";
import { ImmersionOfferId } from "src/shared/ImmersionOfferId";
import { RomeCode } from "src/shared/rome";
import { SiretDto } from "src/shared/siret";
import { ContactInPerson } from "./ContactInPerson";

type ModalState = {
  isOpen: boolean;
  isValidating: boolean;
  siret: SiretDto;
  romeLabel: string;
  contactMethod?: ContactMethod;
};

type ModalAction =
  | {
      type: "CLICKED_OPEN";
      payload: {
        immersionOfferRome: RomeCode;
        immersionOfferSiret: SiretDto;
        siret: SiretDto;
        romeLabel: string;
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
      return {
        romeLabel: "",
        siret: "",
        isOpen: false,
        isValidating: false,
      };
    case "CLICKED_VALIDATE":
      return { ...state, isOpen: false, isValidating: true };
    case "VALIDATION_HANDLED":
      return {
        romeLabel: "",
        siret: "",
        isOpen: false,
        isValidating: false,
      };
    default:
      const shouldNeverBeAssigned: never = action;
      return shouldNeverBeAssigned;
  }
};

export const useContactEstablishmentModal = () => {
  const initialModalState: ModalState = {
    romeLabel: "",
    siret: "",
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
          siret={modalState.siret}
          romeLabel={modalState.romeLabel}
          onSuccess={onSuccess}
        />
      );
    case "PHONE":
      return (
        <ContactByPhone
          siret={modalState.siret}
          romeLabel={modalState.romeLabel}
          onSuccess={onSuccess}
        />
      );
    case "IN_PERSON":
      return (
        <ContactInPerson
          siret={modalState.siret}
          romeLabel={modalState.romeLabel}
          onSuccess={onSuccess}
        />
      );
    default:
      return <AdvisesForContact />;
  }
};

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className="mb-3">{children}</p>
);

const Bold = ({ children }: { children: string }) => (
  <span className="font-bold">{children}</span>
);

const AdvisesForContact = () => {
  return (
    <div>
      <Title red>Tentez votre chance</Title>
      <Paragraph>
        Cette entreprise peut recruter sur ce métier et être intéressée pour
        vous recevoir en immersion. Tentez votre chance en la contactant !
      </Paragraph>

      <Title>Nos conseils pour cette première prise de contact ! </Title>

      <SubTitle>Comment présenter votre demande ? </SubTitle>
      <Paragraph>
        Soyez <Bold>direct, concret et courtois</Bold>. Présentez-vous, indiquez
        que vous avez eu le nom et le numéro de téléphone de votre
        interlocutrice ou interlocuteur grâce à <Bold>Immersion Facilitée</Bold>{" "}
        puis présentez simplement votre projet et l’objectif que vous recherchez
        en effectuant une immersion.
      </Paragraph>
      <Paragraph>
        <Bold>Par exemple : </Bold>
        <span className="italic">
          “Je souhaite devenir mécanicien auto et je voudrais découvrir comment
          ce métier se pratique dans un garage comme le vôtre. Ca me permettra
          de vérifier que cela me plaît vraiment. La personne qui m’accueillera
          et me présentera le métier pourra aussi vérifier si ce métier est fait
          pour moi.”
        </span>
      </Paragraph>
      <Paragraph>
        Vous pouvez indiquer à votre interlocutrice ou interlocuteur que{" "}
        <Bold>
          cette immersion sera encadrée par une convention signée par
          l'organisme qui vous suit.
        </Bold>
      </Paragraph>
      <Paragraph>
        Indiquez lui le moment où vous aimeriez faire une immersion et pourquoi
        vous voulez la faire à cette date.
      </Paragraph>
      <Paragraph>
        <Bold>Par exemple : </Bold>
        <span className="italic">
          “il faudrait que je fasse une immersion avant de m’inscrire à une
          formation. “
        </span>
      </Paragraph>
      <Paragraph>
        Indiquez également le <Bold>nombre de jours</Bold> que vous aimeriez
        faire en immersion si vous le savez déjà.
      </Paragraph>
      <Paragraph>
        Concluez en lui demandant <Bold>un rendez-vous</Bold> pour qu’il/elle se
        rende compte du sérieux de votre projet.
      </Paragraph>

      <SubTitle>
        Comment expliquer simplement ce qu’est une immersion ?
      </SubTitle>
      <Paragraph>
        C’est un stage d’observation, strictement encadré d’un point de vue
        juridique. Vous conservez votre statut et êtes couvert par votre Pôle
        emploi,votre Mission Locale ou le Conseil départemental (en fonction de
        votre situation).
      </Paragraph>
      <Paragraph>
        Le rôle de celui qui vous accueillera est de vous présenter le métier et
        de vérifier avec vous que ce métier vous convient en vous faisant des
        retours les plus objectifs possibles. Pendant la durée de votre
        présence, vous pouvez aider les salariés en donnant un coup de main mais
        vous n’êtes pas là pour remplacer un collègue absent.
      </Paragraph>

      <SubTitle>Quelle est la durée d’une immersion ?</SubTitle>
      <Paragraph>
        Les immersions se font le plus souvent pendant une semaine ou deux.
        <Bold>Il n’est pas possible de dépasser un mois</Bold>. Il est possible
        de faire une immersion de seulement un ou deux jours mais vous ne
        découvrirez pas parfaitement un métier.
      </Paragraph>

      <SubTitle>Bon à savoir ! </SubTitle>
      <Paragraph>
        <Bold>Il n’est pas nécessaire d’apporter votre CV</Bold>. Vous êtes là
        pour demander à découvrir un métier et c’est ce projet qui est
        important, pas vos expériences professionnelles ni votre formation !
      </Paragraph>
    </div>
  );
};
