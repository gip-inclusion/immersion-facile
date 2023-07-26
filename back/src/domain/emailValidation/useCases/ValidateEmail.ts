import {
  ValidateEmailInput,
  validateEmailInputSchema,
  type ValidateEmailStatus,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";

export class ValidateEmail extends UseCase<
  ValidateEmailInput,
  ValidateEmailStatus
> {
  protected inputSchema = validateEmailInputSchema;

  constructor(private emailValidationGateway: EmailValidationGetaway) {
    super();
  }

  protected _execute({
    email,
  }: ValidateEmailInput): Promise<ValidateEmailStatus> {
    return this.emailValidationGateway.validateEmail(email);
  }
}
