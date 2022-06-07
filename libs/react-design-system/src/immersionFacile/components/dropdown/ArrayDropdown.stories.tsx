import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { dropdownPrefix } from ".";
import { ArrayDropdown, ArrayDropdownProps } from "./ArrayDropdown";

const Component = ArrayDropdown;
const argTypes: Partial<ArgTypes<ArrayDropdownProps>> | undefined = {};

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
  labels: ["SOME LABEL 1", "SOME LABEL 2"],
};
