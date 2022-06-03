import { ComponentMeta } from "@storybook/react";

export const buildComponentMeta = (
  Component: ({ ...args }: JSX.Element) => JSX.Element
) =>
  ({
    title: `Immersion Facilité/${Component.name}`,
    component: Component,
    argTypes: {},
  } as ComponentMeta<typeof Component>);
