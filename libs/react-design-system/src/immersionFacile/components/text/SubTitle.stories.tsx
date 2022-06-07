import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { textPrefix } from "../../storyPrefixes";
import { SubTitle } from "./SubTitle";
import { TitleProps } from "./Title";

const Component = SubTitle;
const prefix = textPrefix;
const argTypes: Partial<ArgTypes<TitleProps>> | undefined = {};

export default {
  title: `${prefix}${Component.name}`,
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
