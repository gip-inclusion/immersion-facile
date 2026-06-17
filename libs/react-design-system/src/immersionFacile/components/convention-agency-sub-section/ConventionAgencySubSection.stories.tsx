import type { Meta, StoryObj } from "@storybook/react";
import { ConventionAgencySubSection } from "./ConventionAgencySubSection";
import {
  agencySubSectionWithoutAgencyReferent,
  agencySubSectionWithoutRefersToAgency,
  agencySubSectionWithRefersToAgency,
} from "./ConventionAgencySubSection.fixtures";

export default {
  title: "ConventionAgencySubSection",
  component: ConventionAgencySubSection,
} as Meta<typeof ConventionAgencySubSection>;

type Story = StoryObj<typeof ConventionAgencySubSection>;

export const WithRefersToAgency: Story = {
  args: agencySubSectionWithRefersToAgency,
};

export const WithoutRefersToAgency: Story = {
  args: agencySubSectionWithoutRefersToAgency,
};

export const WithoutAgencyReferent: Story = {
  args: agencySubSectionWithoutAgencyReferent,
};
