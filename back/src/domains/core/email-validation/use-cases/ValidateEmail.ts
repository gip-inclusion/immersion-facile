import {
  type ValidateEmailFeedback,
  type ValidateEmailInput,
  validateEmailInputSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { EmailValidationGetaway } from "../ports/EmailValidationGateway";

export type ValidateEmail = ReturnType<typeof makeValidateEmail>;

export const makeValidateEmail = useCaseBuilder("ValidateEmail")
  .notTransactional()
  .withInput<ValidateEmailInput>(validateEmailInputSchema)
  .withOutput<ValidateEmailFeedback>()
  .withDeps<{ emailValidationGateway: EmailValidationGetaway }>()
  .build(async ({ inputParams, deps }) =>
    deps.emailValidationGateway.validateEmail(inputParams.email),
  );
