import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import {
  FieldDescription,
  FieldDescriptionProperties,
} from "./FieldDescription";
import { fieldPrefix } from ".";

const Component = FieldDescription;
const argTypes: Partial<ArgTypes<FieldDescriptionProperties>> | undefined = {};

export default {
  title: `${fieldPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
