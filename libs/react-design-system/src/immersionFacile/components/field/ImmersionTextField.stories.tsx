import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { fieldPrefix } from ".";
import {
  ImmersionTextField,
  ImmersionTextFieldProps,
} from "./ImmersionTextField";

const Component = ImmersionTextField;
const argTypes: Partial<ArgTypes<ImmersionTextFieldProps>> | undefined = {};

export default {
  title: `${fieldPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  description: "Default",
};
