import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { notificationPrefix } from ".";
import { InfoMessage, InfoMessageProps } from "./InfoMessage";

const Component = InfoMessage;
const argTypes: Partial<ArgTypes<InfoMessageProps>> | undefined = {};

export default {
  title: `${notificationPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {};
