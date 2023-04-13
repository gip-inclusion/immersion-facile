import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import { ArrayDropdown, ArrayDropdownProps } from "./ArrayDropdown";
import { dropdownPrefix } from ".";

const Component = ArrayDropdown;
const argTypes: Partial<ArgTypes<ArrayDropdownProps<string>>> | undefined = {};

export default {
  title: `${dropdownPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  options: ["SOME LABEL 1", "SOME LABEL 2"],
  allowEmpty: true,
};

export const WhenEmptyAllowed = componentStory.bind({});
WhenEmptyAllowed.args = {
  options: ["SOME LABEL 1", "SOME LABEL 2"],
  allowEmpty: true,
};

export const WhenEmptyNotAllowed = componentStory.bind({});
WhenEmptyAllowed.args = {
  options: ["SOME LABEL 1", "SOME LABEL 2"],
  allowEmpty: false,
};
