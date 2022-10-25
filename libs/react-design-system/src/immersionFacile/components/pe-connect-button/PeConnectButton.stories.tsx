import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { peConnectButtonPrefix } from ".";
import { PeConnectButton, PeConnectButtonProps } from "./PeConnectButton";

const Component = PeConnectButton;
const argTypes: Partial<ArgTypes<PeConnectButtonProps>> | undefined = {};

export default {
  title: `${peConnectButtonPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const PeConnectButtonMock = componentStory.bind({});
PeConnectButtonMock.args = {
  peConnectEndpoint: "fake-endpoint",
  onClick: () => alert("clicked"),
};
