import { keys } from "ramda";
import type { Environment } from "../environment";

type AdminTabProps = {
  slug: string;
  isVisible: (env: Environment) => boolean;
};

export const adminTabs = {
  adminConventions: {
    slug: "conventions",
    isVisible: () => true,
  },
  adminEvents: {
    slug: "events",
    isVisible: () => true,
  },
  adminAgencies: {
    slug: "agencies",
    isVisible: () => true,
  },
  adminEstablishments: {
    slug: "establishments",
    isVisible: () => true,
  },
  adminUsers: {
    slug: "users",
    isVisible: () => true,
  },
  adminNotifications: {
    slug: "notifications",
    isVisible: (env: Environment) => env !== "production",
  },
  adminEmailPreview: {
    slug: "email-preview",
    isVisible: () => true,
  },
  adminTechnicalOptions: {
    slug: "technical-options",
    isVisible: () => true,
  },
} satisfies Record<string, AdminTabProps>;

export const adminTabRouteNames = keys(adminTabs);

export type AdminTabRouteName = keyof typeof adminTabs;
