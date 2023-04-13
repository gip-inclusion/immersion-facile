import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { ModalDialog, ModalDialogProperties } from "./Modal";
import { ModalContent } from "./ModalContent";
import { ModalFooter } from "./ModalFooter";
import { ModalTitle } from "./ModalTitle";
import { modalPrefix } from ".";

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
    <ModalTitle key="ModalTitle">
      <span>Exemple de titre</span>
    </ModalTitle>,
    <ModalContent key="ModalContent">
      <div>Exemple de contenu</div>
    </ModalContent>,
    <ModalFooter key="ModalFooter">
      <span>Exemple de footer</span>
    </ModalFooter>,
  ],
  isOpen: true,
  canClose: true,
  size: "md",
};
