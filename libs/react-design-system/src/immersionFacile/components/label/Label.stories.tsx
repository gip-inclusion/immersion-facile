import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import { Label, LabelProperties } from "./Label";
import { labelPrefix } from ".";

const Component = Label;
const argTypes: Partial<ArgTypes<LabelProperties>> | undefined = {};

export default {
  title: `${labelPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = { htmlFor: "default", label: "Default" };
