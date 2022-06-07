import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { buttonPrefix } from ".";
import { ButtonHome, HomeButtonProps } from "./ButtonHome";

const Component = ButtonHome;
const argTypes: Partial<ArgTypes<HomeButtonProps>> | undefined = {};

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
