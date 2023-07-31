import React from "react";
import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { AutocompleteInput, AutocompleteInputProps } from "./AutocompleteInput";

const Component = AutocompleteInput;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<AutocompleteInputProps>> | undefined = {};

const componentDescription = `
Utilisé avec \`Autocomplete\` de [material-ui](https://mui.com/material-ui/react-autocomplete/#search-as-you-type): permet d'afficher un champ \`input\` où la valeur sera définie à partir d'une liste prédéfinie.

\`\`\`tsx  
import { AutocompleteInput } from "react-design-system";
\`\`\`
`;

export default {
  title: "AutocompleteInput",
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
    disabled: false,
    id: "input_id",
    params: {
      id: "input_id",
      disabled: false,
      fullWidth: false,
      size: "small",
      InputLabelProps: {},
      InputProps: {
        className: "",
        endAdornment: undefined,
        ref: React.createRef(),
        startAdornment: undefined,
      },
      inputProps: {},
    },
  },
};
