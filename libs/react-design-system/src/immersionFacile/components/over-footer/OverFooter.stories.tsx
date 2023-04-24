import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { OverFooter, OverFooterProps } from "./OverFooter";

const Component = OverFooter;
const argTypes: Partial<ArgTypes<OverFooterProps>> | undefined = {};

export default {
  title: "OverFooter",
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const OverFooterMock = componentStory.bind({});
OverFooterMock.args = {
  cols: [
    {
      title: "Rejoignez la communauté",
      subtitle:
        "Rejoignez la communauté d'Immersion Facilitée et suivez nos actualités",
      iconTitle: "fr-icon-links-fill",
      link: {
        label: "Rejoignez-nous sur Linkedin",
        url: "https://www.linkedin.com/company/l-immersion-facilitee/",
      },
      id: "im-over-footer__link-1",
    },
    {
      title: "Le centre de support",
      subtitle:
        "Consultez notre centre d'aide (FAQ) pour trouvez les réponses aux principales questions demandées",
      iconTitle: "fr-icon-questionnaire-fill",
      link: {
        label: "Accédez à notre FAQ",
        url: "https://aide.immersion-facile.beta.gouv.fr/fr/",
      },
      id: "im-over-footer__link-2",
    },
  ],
};
