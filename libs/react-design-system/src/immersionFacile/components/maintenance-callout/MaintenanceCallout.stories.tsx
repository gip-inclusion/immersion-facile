import type { ArgTypes, Meta, StoryObj } from "@storybook/react-vite";
import {
  MaintenanceCallout,
  type MaintenanceCalloutProps,
} from "./MaintenanceCallout";

const Component = MaintenanceCallout;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<MaintenanceCalloutProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { MaintenanceCallout } from "react-design-system";
\`\`\`
`;

export default {
  title: "MaintenanceCallout",
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
    message: "insérer ici le message de maintenance",
    level: "info",
  },
};
