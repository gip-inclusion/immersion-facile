import { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { Footer, FooterProps } from "./Footer";

const Component = Footer;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<FooterProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { Footer } from "react-design-system";
\`\`\`
`;

export default {
  title: "Footer",
  component: Component,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: componentDescription,
      },
    },
  },
} as Meta<typeof Component>;

export const Default: Story = {
  args: {
    links: [
      {
        label: "Footer link 1",
        href: "#link-1",
        id: "im-footer__link-1",
      },
      {
        label: "Footer link 2",
        href: "#link-2",
        id: "im-footer__link-2",
      },
    ],
    bottomLinks: [
      {
        label: "Bottom link 1",
        href: "#link-1",
        target: "_blank",
        id: "im-footer__link-3",
      },
      {
        label: "Bottom link 2",
        href: "#link-2",
        id: "im-footer__link-4",
      },
      {
        label: "Bottom link 3",
        href: "#link-3",
        target: "_blank",
        id: "im-footer__link-5",
      },
      {
        label: "Bottom link 4",
        href: "#link-4",
        id: "im-footer__link-6",
      },
    ],
  },
};
