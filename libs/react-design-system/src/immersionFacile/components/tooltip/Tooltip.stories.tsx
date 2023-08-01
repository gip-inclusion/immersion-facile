import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipProps } from "./Tooltip";

const Component = Tooltip;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<TooltipProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { Tooltip } from "react-design-system";
\`\`\`

Alternatively, you may use:
- [Alert](https://components.react-dsfr.codegouv.studio/?path=/docs/components-alert--default)
- [Accordion](https://components.react-dsfr.codegouv.studio/?path=/docs/components-accordion--default)
`;

export default {
  title: "Tooltip",
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

export const TooltipOnHover: Story = {
  name: "Tooltip on hover",
  args: {
    type: "hover",
    description: "Lorem [...] elit ut.",
    elementToDescribe: (
      <a className="fr-link" href="#">
        {" "}
        Exemple
      </a>
    ),
  },
};

export const TooltipOnClick: Story = {
  name: "Tooltip on click",
  args: {
    type: "click",
    description: "Lorem [...] elit ut.",
  },
};
