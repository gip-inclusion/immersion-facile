export type EmailFilterConfig = {
  onRejected: (filteredEmail: string) => void;
};

export interface EmailFilter {
  filter: (unfilteredEmails: string[], config?: EmailFilterConfig) => string[];
}
