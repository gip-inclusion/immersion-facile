import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import {
  FieldDescription,
  FieldDescriptionProperties,
} from "./FieldDescription";

const Component = FieldDescription;
const argTypes: Partial<ArgTypes<FieldDescriptionProperties>> | undefined = {};

export default {
  title: "FieldDescription",
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
