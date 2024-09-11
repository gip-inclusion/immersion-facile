import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { OAuthButton, OAuthButtonProps } from "./OAuthButton";

const Component = OAuthButton;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<OAuthButtonProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { OAuthButton } from "react-design-system";
\`\`\`
`;

export default {
  title: "OAuthButton",
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
    authenticationEndpoint: "fake-endpoint",
    onClick: () => alert("clicked"),
  },
};
