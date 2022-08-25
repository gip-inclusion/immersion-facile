import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { modalPrefix } from ".";
import { ModalDialog, ModalDialogProperties } from "./Modal";
import { ModalTitle } from "./ModalTitle";
import { ModalContent } from "./ModalContent";
import { ModalFooter } from "./ModalFooter";

const Component = ModalDialog;
const argTypes: Partial<ArgTypes<ModalDialogProperties>> | undefined = {};

export default {
  title: `${modalPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  children: [
    <ModalTitle>
      <span>Exemple de titre</span>
    </ModalTitle>,
    <ModalContent>
      <div>Exemple de contenu</div>
    </ModalContent>,
    <ModalFooter>
      <span>Exemple de footer</span>
    </ModalFooter>,
  ],
  isOpen: true,
  canClose: true,
  size: "md",
};
