import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { ButtonProperties } from "src/designSystemFrance/components/button/Button";
import { logoPrefix } from ".";
import { MarianneLogo } from "./MarianneLogo";

const Component = MarianneLogo;
const argTypes: Partial<ArgTypes<ButtonProperties>> | undefined = {};

export default {
  title: `${logoPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = () => <Component />;

export const Default = template.bind({});
