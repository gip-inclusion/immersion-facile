import React from "react";
import {
  AccordionDSFR,
  AccordionDSFRItem,
} from "react-design-system/designSystemFrance";
import { SubTitle } from "react-design-system/immersionFacile";

export const OurAdvises = () => (
  <div className="fr-container">
    <h2>Nos conseils pour décrocher une immersion</h2>
    <div className="fr-grid-row fr-grid-row--gutters">
      <p className="fr-col-12 fr-col-md-4">
        Nous vous proposons de vous mettre directement en relation avec les
        entreprises signalées comme “entreprises accueillantes”. Pour les
        autres, voici nos conseils :
      </p>
      <AccordionDSFR keepOpen={true} className="fr-col-12 fr-col-md-8">
        <AccordionDSFRItem
          title={"Comment contacter un employeur pour faire une immersion ?"}
          titleAs={"h3"}
        >
          <ul className="fr-py-1w">
            <li>
              Pour une petite entreprise, un artisan, un commerce, rendez-vous
              sur place et demandez à rencontrer le responsable.
            </li>
            <li>
              Dans une entreprise de plus grosse taille (plus de 10 salariés),
              appelez l’entreprise par téléphone et demandez à parler au
              responsable des ressources humaines.
            </li>
            <li>
              Bon à savoir : nous vous indiquons, quand nous avons cette
              information, le nombre de salariés de l’entreprise
            </li>
          </ul>
        </AccordionDSFRItem>
        <AccordionDSFRItem
          title={
            <SubTitle>Comment expliquer l'immersion à un employeur ?</SubTitle>
          }
        >
          <ul className="fr-py-1w">
            <li>
              C’est un stage d’observation, strictement encadré d’un point de
              vue juridique. Vous conservez votre statut et êtes couvert par
              votre Pôle emploi, votre Mission Locale ou le Conseil
              départemental (en fonction de votre situation).
            </li>
            <li>
              Le rôle de celui qui vous accueillera est de vous présenter le
              métier et de vérifier avec vous que ce métier vous convient en
              vous faisant des retours les plus objectifs possibles.
            </li>
            <li>
              Pendant la durée de votre présence, vous allez vous essayer aux
              gestes techniques du métier. Vous pouvez aussi aider les salariés
              en donnant un coup de main mais vous n’êtes pas là pour remplacer
              un collègue absent.
            </li>
          </ul>
        </AccordionDSFRItem>
      </AccordionDSFR>
    </div>
  </div>
);
