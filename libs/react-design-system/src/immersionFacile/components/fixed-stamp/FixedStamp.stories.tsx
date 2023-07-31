import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { FixedStamp, FixedStampProps } from "./FixedStamp";

const Component = FixedStamp;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<FixedStampProps>> | undefined = {};

const componentDescription = `
Affiche une étiquette fixe sur le côté droit de la page.

\`\`\`tsx  
import { FixedStamp } from "react-design-system";
\`\`\`
`;

export default {
  title: "FixedStamp",
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
    subtitle: "ouvre ses portes aux nouveaux talents, pourquoi pas vous ?",
    image: (
      <img src={"assets/images/logo-if.svg"} alt="Inclusiv'Day - Décathlon" />
    ),
  },
};
