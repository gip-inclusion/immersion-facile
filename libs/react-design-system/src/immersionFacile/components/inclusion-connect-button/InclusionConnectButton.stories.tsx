import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import {
  InclusionConnectButton,
  InclusionConnectButtonProps,
} from "./InclusionConnectButton";

const Component = InclusionConnectButton;
const argTypes: Partial<ArgTypes<InclusionConnectButtonProps>> | undefined = {};

export default {
  title: "InclusionConnectButton",
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const PeConnectButtonMock = componentStory.bind({});
PeConnectButtonMock.args = {
  inclusionConnectEndpoint: "fake-endpoint",
  onClick: () => alert("clicked"),
};
