import { createTargets, CreateTargets, Target } from "http-client";

const validateEmailUrl = "/validate-email";

type ValidateEmailParams = {
  email: string;
};

export type ValidateEmailTargets = CreateTargets<{
  validateEmail: Target<
    void,
    ValidateEmailParams,
    void,
    typeof validateEmailUrl
  >;
}>;

export const validateEmailsTargets = createTargets<ValidateEmailTargets>({
  validateEmail: { method: "GET", url: validateEmailUrl },
});
