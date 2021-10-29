import {
  EmailFilter,
  EmailFilterConfig,
} from "../../../domain/core/ports/EmailFilter";

export class AllowListEmailFilter implements EmailFilter {
  private readonly allowedEmails: Set<string>;

  constructor(allowedEmailList: string[]) {
    this.allowedEmails = new Set(allowedEmailList);
  }

  public filter(unfilteredEmails: string[], config?: EmailFilterConfig) {
    return unfilteredEmails.filter((email) => {
      if (this.allowedEmails.has(email)) return true;
      config?.onRejected(email);
      return false;
    });
  }
}

export class AlwaysAllowEmailFilter implements EmailFilter {
  public filter(unfilteredEmails: string[]) {
    return unfilteredEmails;
  }
}
