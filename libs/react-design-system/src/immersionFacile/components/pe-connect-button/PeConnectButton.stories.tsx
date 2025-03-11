import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { PeConnectButton, type PeConnectButtonProps } from "./PeConnectButton";

const Component = PeConnectButton;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<PeConnectButtonProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { PeConnectButton } from "react-design-system";
\`\`\`
`;

export default {
  title: "PeConnectButton",
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
    peConnectEndpoint: "fake-endpoint",
    onClick: () => alert("clicked"),
  },
};
