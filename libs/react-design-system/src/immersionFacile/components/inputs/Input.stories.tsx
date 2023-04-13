import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { Input, InputProperties } from "./Input";
import { inputPrefix } from ".";

const Component = Input;
const argTypes: Partial<ArgTypes<InputProperties>> | undefined = {};

export default {
  title: `${inputPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  name: "Defaut name",
  value: "Default value",
  type: "text",
};
