import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import { InputGroup, InputGroupProperties } from "./InputGroup";
import { inputPrefix } from ".";

const Component = InputGroup;
const argTypes: Partial<ArgTypes<InputGroupProperties>> | undefined = {};

export default {
  title: `${inputPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  children: "Default",
};
