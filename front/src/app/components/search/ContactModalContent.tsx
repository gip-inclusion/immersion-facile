import React, { ReactNode } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import {
  ContactMethod,
  RomeDto,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { SubTitle } from "react-design-system";
import { ContactByEmail } from "./ContactByEmail";
import { ContactByPhone } from "./ContactByPhone";

export type ContactModalContentProps = {
  contactMethod?: ContactMethod;
  siret: SiretDto;
  offer: RomeDto;
  searchResultData?: SearchImmersionResultDto;
  onSuccess: () => void;
};

export const ModalContactContent = ({
  contactMethod,
  siret,
  offer,
  onSuccess,
  searchResultData,
}: ContactModalContentProps) => {
  switch (contactMethod) {
    case "EMAIL":
      return (
        <ContactByEmail siret={siret} offer={offer} onSuccess={onSuccess} />
      );
    case "PHONE":
      return (
        <ContactByPhone siret={siret} offer={offer} onSuccess={onSuccess} />
      );
    case "IN_PERSON":
      return (
        <ContactByEmail siret={siret} offer={offer} onSuccess={onSuccess} />
      );
    default:
      return <AdvisesForContact data={searchResultData} />;
  }
};

const AdvisesForContact = ({
  data,
}: {
  data: SearchImmersionResultDto | undefined;
}) => (
  <div>
    <Paragraph>
      Cette entreprise peut recruter sur ce métier et être intéressée pour vous
      recevoir en immersion. Tentez votre chance en la contactant !
    </Paragraph>
    <ul className={fr.cx("fr-btns-group", "fr-mt-3w")}>
      <li>
        {data?.website && (
          <a
            className={fr.cx("fr-btn", "fr-btn--secondary")}
            href={data?.website}
            target="_blank"
            rel="noreferrer"
          >
            Aller sur le site de l'entreprise
          </a>
        )}
      </li>
      <li>
        <a
          className={fr.cx("fr-btn", "fr-btn--secondary")}
          href={getMapsLink(data)}
          target="_blank"
          rel="noreferrer"
        >
          Localiser l'entreprise et trouver son contact
        </a>
      </li>
    </ul>
    <hr className={fr.cx("fr-hr", "fr-mt-2w")} />
    <h2 className={fr.cx("fr-h5")}>
      Nos conseils pour cette première prise de contact&nbsp;!{" "}
    </h2>

    <SubTitle>Comment présenter votre demande ? </SubTitle>
    <Paragraph>
      Soyez <Bold>direct, concret et courtois</Bold>. Présentez-vous, présentez
      simplement votre projet et l’objectif que vous recherchez en effectuant
      une immersion.
    </Paragraph>
    <Paragraph>
      <Bold>Par exemple : </Bold>
      <span>
        “Je souhaite devenir mécanicien auto et je voudrais découvrir comment ce
        métier se pratique dans un garage comme le vôtre. Ca me permettra de
        vérifier que cela me plaît vraiment. La personne qui m’accueillera et me
        présentera le métier pourra aussi vérifier si ce métier est fait pour
        moi.”
      </span>
    </Paragraph>
    <Paragraph>
      Vous pouvez indiquer à votre interlocutrice ou interlocuteur que{" "}
      <Bold>
        cette immersion sera encadrée par une convention signée par l'organisme
        qui vous suit.
      </Bold>
    </Paragraph>
    <Paragraph>
      Indiquez lui le moment où vous aimeriez faire une immersion et pourquoi
      vous voulez la faire à cette date.
    </Paragraph>
    <Paragraph>
      <Bold>Par exemple : </Bold>
      <span>
        “il faudrait que je fasse une immersion avant de m’inscrire à une
        formation. “
      </span>
    </Paragraph>
    <Paragraph>
      Indiquez également le <Bold>nombre de jours</Bold> que vous aimeriez faire
      en immersion si vous le savez déjà.
    </Paragraph>
    <Paragraph>
      Concluez en lui demandant <Bold>un rendez-vous</Bold> pour qu’il/elle se
      rende compte du sérieux de votre projet.
    </Paragraph>

    <SubTitle>Comment expliquer simplement ce qu’est une immersion ?</SubTitle>
    <Paragraph>
      C’est un stage d’observation, strictement encadré d’un point de vue
      juridique. Vous conservez votre statut et êtes couvert par votre Pôle
      emploi,votre Mission Locale ou le Conseil départemental (en fonction de
      votre situation).
    </Paragraph>
    <Paragraph>
      Le rôle de celui qui vous accueillera est de vous présenter le métier et
      de vérifier avec vous que ce métier vous convient en vous faisant des
      retours les plus objectifs possibles. Pendant la durée de votre présence,
      vous pouvez aider les salariés en donnant un coup de main mais vous n’êtes
      pas là pour remplacer un collègue absent.
    </Paragraph>

    <SubTitle>Quelle est la durée d’une immersion ?</SubTitle>
    <Paragraph>
      Les immersions se font le plus souvent pendant une semaine ou deux.{" "}
      <Bold>Il n’est pas possible de dépasser un mois</Bold>. Il est possible de
      faire une immersion de seulement un ou deux jours mais vous ne découvrirez
      pas parfaitement un métier.
    </Paragraph>

    <SubTitle>Bon à savoir ! </SubTitle>
    <Paragraph>
      <Bold>Il n’est pas nécessaire d’apporter votre CV</Bold>. Vous êtes là
      pour demander à découvrir un métier et c’est ce projet qui est important,
      pas vos expériences professionnelles ni votre formation !
    </Paragraph>
  </div>
);

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className={fr.cx("fr-mb-2w")}>{children}</p>
);

const Bold = ({ children }: { children: string }) => (
  <strong>{children}</strong>
);

export const getMapsLink = (
  searchResultData: SearchImmersionResultDto | undefined,
) => {
  if (!searchResultData) return;
  const { address, name } = searchResultData;
  const queryString = `${address.streetNumberAndAddress} ${address.postcode} ${address.city} ${name}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURI(
    queryString,
  )}`;
};
