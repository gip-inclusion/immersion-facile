import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Button } from "./Button";
export default {
  title: "Immersion Facilité/Button",
  component: Button,
  argTypes: {
    onSubmit: {
      table: {
        category: "Events",
        subcategory: "Button Events",
      },
    },
  },
} as ComponentMeta<typeof Button>;
const ButtonTemplate: ComponentStory<typeof Button> = (args) => (
  <Button {...args} />
);

export const Default = ButtonTemplate.bind({});
Default.args = {
  children: "Default",
};
export const Secondary = ButtonTemplate.bind({});
Secondary.args = {
  children: "Secondary",
  level: "secondary",
};
