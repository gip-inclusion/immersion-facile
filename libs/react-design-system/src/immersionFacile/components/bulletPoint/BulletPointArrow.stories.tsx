import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { bulletPointPrefix } from ".";
import {
  BulletPointArrow,
  BulletPointArrowProperties,
} from "./BulletPointArrow";

const Component = BulletPointArrow;
const argTypes: Partial<ArgTypes<BulletPointArrowProperties>> | undefined = {};

export default {
  title: `${bulletPointPrefix}${Component.name}`,
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
