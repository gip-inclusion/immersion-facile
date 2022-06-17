import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { tabsPrefix } from ".";
import { Tabs } from "./Tabs";

const Component = Tabs;
const argTypes: Partial<ArgTypes> | undefined = {}; // <TabsProperties>

export default {
  title: `${tabsPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = () => (
  <Component
    content={{
      "Tab #1": <div>Le contenu de la tab #1</div>,
      "Tab #2": <div>Le contenu de la tab #2</div>,
      "Tab #3": <div>Le contenu de la tab #3</div>,
    }}
  /> //{...args}
);

export const Basic = componentStory.bind({});
