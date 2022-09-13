import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { ButtonProperties } from "src/designSystemFrance/components/button/Button";
import { buttonPrefix } from ".";
import { Button } from "./Button";

const Component = Button;
const argTypes: Partial<ArgTypes<ButtonProperties>> | undefined = {};

export default {
  title: `${buttonPrefix}${Component.name}`,
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
