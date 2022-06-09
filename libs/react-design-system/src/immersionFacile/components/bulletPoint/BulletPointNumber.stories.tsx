import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { bulletPointPrefix } from ".";
import {
  BulletPointNumber,
  BulletPointNumberProperties,
} from "./BulletPointNumber";

const Component = BulletPointNumber;
const argTypes: Partial<ArgTypes<BulletPointNumberProperties>> | undefined = {};

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
