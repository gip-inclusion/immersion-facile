import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Header, HeaderProperties } from "./Header";
import logoIF from "../../../../../front/src/assets/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "DSFR/Header",
  component: Header,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Header>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Header> = (args) => <Header {...args} />;

export const Minimal = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Minimal.args = {
  entityTitle: "République Française",
  operator: {
    logo: null,
    title: "",
    baseline: "",
  },
};

export const WithOperatorLogo = Template.bind({});
WithOperatorLogo.args = {
  operator: {
    logo: <img src={logoIF} alt="" style={{ width: 95 }} />,
    title: "",
    baseline: "",
  },
};

export const WithOperatorLogoAndTitle = Template.bind({});
WithOperatorLogoAndTitle.args = {
  operator: {
    logo: <img src={logoIF} alt="" style={{ width: 95 }} />,
    title: "Immersion Facilitée",
    baseline: "Faciliter la réalisation des immersions professionnelles",
  },
};
