import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { buttonPrefix } from ".";
import { ButtonDelete, ButtonDeleteProps } from "./ButtonDelete";

const Component = ButtonDelete;
const argTypes: Partial<ArgTypes<ButtonDeleteProps>> | undefined = {};

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
