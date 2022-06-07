import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { cardPrefix } from ".";
import { Card, CardProps } from "./Card";

const Component = Card;
const argTypes: Partial<ArgTypes<CardProps>> | undefined = {};

export default {
  title: `${cardPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  imageUrl:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Yes_check.svg/600px-Yes_check.svg.png",
};
