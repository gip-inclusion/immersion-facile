import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { TextArea, TextAreaProperties } from "./TextArea";

const Component = TextArea;
const argTypes: Partial<ArgTypes<TextAreaProperties>> | undefined = {};

export default {
  title: "TextArea",
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  name: "Default",
  value: "Default Value",
};
