import Button from "@codegouvfr/react-dsfr/Button";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { Task, type TaskProps } from "./Task";

const Component = Task;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<TaskProps>> | undefined = {};

const componentDescription = `
Afficher des lignes d'éléments.

\`\`\`tsx  
import { Task } from "react-design-system";
\`\`\`
`;

export default {
  title: "Task",
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
    title: "Un titre",
    titleAs: "h3",
    description: "Une description",
    buttonsRows: [
      {
        id: "button-id",
        content: (
          <Button priority="secondary" size="medium">
            Traiter
          </Button>
        ),
      },
    ],
  },
};
