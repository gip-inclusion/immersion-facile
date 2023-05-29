import { TemplatedEmail, TemplatedSms } from "shared";

export type Notification =
  | { kind: "email"; email: TemplatedEmail }
  | { kind: "sms"; sms: TemplatedSms };
