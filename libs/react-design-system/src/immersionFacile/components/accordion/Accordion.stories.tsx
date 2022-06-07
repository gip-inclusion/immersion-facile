import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { accordionPrefix } from ".";
import { Accordion, AccordionProps } from "./Accordion";

const Component = Accordion;
const argTypes: Partial<ArgTypes<AccordionProps>> | undefined = {};

export default {
  title: `${accordionPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {
  children: "Default",
};
