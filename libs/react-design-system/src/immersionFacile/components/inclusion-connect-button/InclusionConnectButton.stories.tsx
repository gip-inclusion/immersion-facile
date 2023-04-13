import React from "react";
import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";

import {
  InclusionConnectButton,
  InclusionConnectButtonProps,
} from "./InclusionConnectButton";
import { inclusionConnectButtonPrefix } from ".";

const Component = InclusionConnectButton;
const argTypes: Partial<ArgTypes<InclusionConnectButtonProps>> | undefined = {};

export default {
  title: `${inclusionConnectButtonPrefix}${Component.name}`,
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
