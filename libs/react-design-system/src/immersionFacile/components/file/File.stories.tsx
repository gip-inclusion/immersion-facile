import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import { File, FileProperties } from "./File";
import { filePrefix } from ".";

const Component = File;
const argTypes: Partial<ArgTypes<FileProperties>> | undefined = {};

export default {
  title: `${filePrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  errorMessage: "Voici un message d'erreur",
  hint: "Voici une indication",
  label: "Nom du champ",
};
