import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { buttonPrefix } from "../../storyPrefixes";
import { HomeButton, HomeButtonProps } from "./HomeButton";

const Component = HomeButton;
const prefix = buttonPrefix;
const argTypes: Partial<ArgTypes<HomeButtonProps>> | undefined = {};

export default {
  title: `${prefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {};
