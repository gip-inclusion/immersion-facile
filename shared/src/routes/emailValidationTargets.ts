import { createTargets, CreateTargets, Target } from "http-client";

const emailValidationUrl = "/email/validation";

type EmailValidationParams = {
  email: string;
};

export type EmailValidationTargets = CreateTargets<{
  getEmailStatus: Target<
    void,
    EmailValidationParams,
    void,
    typeof emailValidationUrl
  >;
}>;

export const emailValidationTargets = createTargets<EmailValidationTargets>({
  getEmailStatus: { method: "GET", url: emailValidationUrl },
});
