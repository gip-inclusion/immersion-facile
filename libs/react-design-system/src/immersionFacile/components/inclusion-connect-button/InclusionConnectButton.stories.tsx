import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  InclusionConnectButton,
  InclusionConnectButtonProps,
} from "./InclusionConnectButton";

const Component = InclusionConnectButton;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<InclusionConnectButtonProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { InclusionConnectButton } from "react-design-system";
\`\`\`
`;

export default {
  title: "InclusionConnectButton",
  component: Component,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: componentDescription,
      },
    },
  },
} as Meta<typeof Component>;

export const PeConnectButtonMock: Story = {
  args: {
    inclusionConnectEndpoint: "fake-endpoint",
    onClick: () => alert("clicked"),
  },
};
