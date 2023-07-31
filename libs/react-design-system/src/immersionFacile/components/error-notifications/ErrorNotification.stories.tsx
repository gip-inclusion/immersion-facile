import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import {
  ErrorNotifications,
  ErrorNotificationsProps,
} from "./ErrorNotifications";

const Component = ErrorNotifications;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<ErrorNotificationsProps>> | undefined = {};

const componentDescription = `
Affiche un section contenant une liste d'erreurs.

\`\`\`tsx  
import { ErrorNotifications } from "react-design-system";
\`\`\`
`;

export default {
  title: "ErrorNotifications",
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

export const Default: Story = {
  args: {
    errors: {
      birthdate: "Format invalide",
    },
    labels: {
      birthdate: "date de naissance",
    },
    visible: true,
  },
};
