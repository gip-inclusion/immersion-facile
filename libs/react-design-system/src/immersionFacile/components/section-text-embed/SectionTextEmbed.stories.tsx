import type { ArgTypes, Meta, StoryObj } from "@storybook/react";
import { SectionTextEmbed, SectionTextEmbedProps } from "./SectionTextEmbed";

const Component = SectionTextEmbed;
type Story = StoryObj<typeof Component>;
const argTypes: Partial<ArgTypes<SectionTextEmbedProps>> | undefined = {};

const componentDescription = `
\`\`\`tsx  
import { SectionTextEmbed } from "react-design-system";
\`\`\`
`;

export default {
  title: "SectionTextEmbed",
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
    videoUrl: "https://www.fake-url.com/video.mp4",
    videoPosterUrl: "https://www.fake-url.com/video_poster.webp",
    videoDescription: "https://www.fake-url.com/video_transcript.vtt",
    videoTranscription: "https://www.fake-url.com/video_transcript.txt",
  },
};
