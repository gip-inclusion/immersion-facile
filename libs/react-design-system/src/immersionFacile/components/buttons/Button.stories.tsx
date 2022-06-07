import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { ButtonProperties } from "src/designSystemFrance/button/Button";
import { buttonPrefix } from "../../storyPrefixes";
import { Button } from "./Button";

const Component = Button;
const prefix = buttonPrefix;
const argTypes: Partial<ArgTypes<ButtonProperties>> | undefined = {};

export default {
  title: `${prefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {
  children: "Default",
};
export const Secondary = template.bind({});
Secondary.args = {
  children: "Secondary",
  level: "secondary",
};
