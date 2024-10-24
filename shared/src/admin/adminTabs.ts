import { keys } from "ramda";

type AdminTabProps = {
  slug: string;
  isVisible: (env: "dev" | "staging" | "production" | "local") => boolean;
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
  adminUsers: {
    slug: "users",
    isVisible: () => true,
  },
  adminEstablishments: {
    slug: "establishments",
    isVisible: () => true,
  },
  adminNotifications: {
    slug: "notifications",
    isVisible: (env: "dev" | "staging" | "production" | "local") =>
      env !== "production",
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
