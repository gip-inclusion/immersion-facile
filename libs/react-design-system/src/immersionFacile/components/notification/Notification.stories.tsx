import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { notificationPrefix } from ".";
import { Notification, NotificationProperties } from "./Notification";

const Component = Notification;
const argTypes: Partial<ArgTypes<NotificationProperties>> | undefined = {};

export default {
  title: `${notificationPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Info = componentStory.bind({});
Info.args = { type: "info", title: "Info" };

export const Success = componentStory.bind({});
Success.args = { type: "success", title: "Success" };

export const Error = componentStory.bind({});
Error.args = { type: "error", title: "Error" };
