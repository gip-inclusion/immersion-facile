import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { buttonPrefix } from ".";
import { ButtonAdd, ButtonAddProps } from "./ButtonAdd";

const Component = ButtonAdd;
const argTypes: Partial<ArgTypes<ButtonAddProps>> | undefined = {};

export default {
  title: `${buttonPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {};
