export const adminTabsList = [
  "conventions",
  "events",
  "agencies",
  "establishments",
  "notifications",
  "email-preview",
  "technical-options",
] as const;

type AdminTabProps = {
  isVisible: (env: "dev" | "staging" | "production" | "local") => boolean;
};

export const adminTabs: Record<AdminTab, AdminTabProps> = {
  conventions: {
    isVisible: () => true,
  },
  events: {
    isVisible: () => true,
  },
  agencies: {
    isVisible: () => true,
  },
  establishments: {
    isVisible: () => true,
  },
  notifications: {
    isVisible: (env: "dev" | "staging" | "production" | "local") =>
      env !== "production",
  },
  "email-preview": {
    isVisible: () => true,
  },
  "technical-options": {
    isVisible: () => true,
  },
} as const;

export type AdminTabList = typeof adminTabsList;
export type AdminTab = AdminTabList[number];
