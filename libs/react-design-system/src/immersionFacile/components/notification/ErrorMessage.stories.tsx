import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { notificationPrefix } from ".";
import { ErrorMessage, ErrorMessageProps } from "./ErrorMessage";

const Component = ErrorMessage;
const argTypes: Partial<ArgTypes<ErrorMessageProps>> | undefined = {};

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
