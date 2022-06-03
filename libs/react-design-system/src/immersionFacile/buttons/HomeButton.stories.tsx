import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { HomeButton, HomeButtonProps } from "./HomeButton";

const Component = HomeButton;

const argTypes: Partial<ArgTypes<HomeButtonProps>> | undefined = {};
export default {
  title: `Immersion Facilité/${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;
const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {};
