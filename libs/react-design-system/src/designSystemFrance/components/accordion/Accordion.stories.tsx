import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { accordionDSFRPrefix } from ".";
import { AccordionDSFR, AccordionProperties } from "./Accordion";
import { AccordionDSFRItem } from "./AccordionItem";

const Component = AccordionDSFR;
const argTypes: Partial<ArgTypes<AccordionProperties>> | undefined = {};

export default {
  title: `${accordionDSFRPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);
export const Default = template.bind({});
Default.args = {
  children: [
    <AccordionDSFRItem
      title={`Comment contacter un employeur pour faire une immersion ?`}
    >
      <ul className="p-1">
        <li>
          Pour une petite entreprise, un artisan, un commerce, rendez-vous sur
          place et demandez à rencontrer le responsable.
        </li>
        <li>
          Dans une entreprise de plus grosse taille (plus de 10 salariés),
          appelez l’entreprise par téléphone et demandez à parler au responsable
          des ressources humaines.
        </li>
        <li>
          Bon à savoir : nous vous indiquons, quand nous avons cette
          information, le nombre de salariés de l’entreprise
        </li>
      </ul>
    </AccordionDSFRItem>,
    <AccordionDSFRItem title={`Comment expliquer l'immersion à un employeur ?`}>
      <ul className="p-1">
        <li>
          C’est un stage d’observation, strictement encadré d’un point de vue
          juridique. Vous conservez votre statut et êtes couvert par votre Pôle
          emploi, votre Mission Locale ou le Conseil départemental (en fonction
          de votre situation).
        </li>
        <li>
          Le rôle de celui qui vous accueillera est de vous présenter le métier
          et de vérifier avec vous que ce métier vous convient en vous faisant
          des retours les plus objectifs possibles.
        </li>
        <li>
          Pendant la durée de votre présence, vous allez vous essayer aux gestes
          techniques du métier. Vous pouvez aussi aider les salariés en donnant
          un coup de main mais vous n’êtes pas là pour remplacer un collègue
          absent.
        </li>
      </ul>
    </AccordionDSFRItem>,
  ],
  className: ["w-full max-w-3xl"],
};
