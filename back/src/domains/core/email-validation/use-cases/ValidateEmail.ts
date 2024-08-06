import {
  type ValidateEmailFeedback,
  ValidateEmailInput,
  validateEmailInputSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";

export class ValidateEmail extends UseCase<
  ValidateEmailInput,
  ValidateEmailFeedback
> {
  protected inputSchema = validateEmailInputSchema;

  constructor(private emailValidationGateway: EmailValidationGetaway) {
    super();
  }

  protected _execute({
    email,
  }: ValidateEmailInput): Promise<ValidateEmailFeedback> {
    return this.emailValidationGateway.validateEmail(email);
  }
}
