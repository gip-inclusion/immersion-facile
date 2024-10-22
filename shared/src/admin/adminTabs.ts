import { keys } from "ramda";

type AdminTabProps = {
  isVisible: (env: "dev" | "staging" | "production" | "local") => boolean;
};

export const adminTabs = {
  adminConventions: {
    isVisible: () => true,
  },
  adminEvents: {
    isVisible: () => true,
  },
  adminAgencies: {
    isVisible: () => true,
  },
  adminUsers: {
    isVisible: () => true,
  },
  adminEstablishments: {
    isVisible: () => true,
  },
  adminNotifications: {
    isVisible: (env: "dev" | "staging" | "production" | "local") =>
      env !== "production",
  },
  adminEmailPreview: {
    isVisible: () => true,
  },
  adminTechnicalOptions: {
    isVisible: () => true,
  },
} satisfies Record<string, AdminTabProps>;

export const adminTabRouteNames = keys(adminTabs);

export type AdminTabRouteName = keyof typeof adminTabs;
