import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { ButtonProperties } from "src/designSystemFrance/components/button/Button";
import { logoPrefix } from ".";
import { ImmersionLogo } from "./ImmersionLogo";

const Component = ImmersionLogo;
const argTypes: Partial<ArgTypes<ButtonProperties>> | undefined = {};

export default {
  title: `${logoPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const template: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = template.bind({});
Default.args = {
  url: "https://immersion-facile.beta.gouv.fr/Logo-immersion-facilitee-01-RVB-reflets-crop.svg",
};
