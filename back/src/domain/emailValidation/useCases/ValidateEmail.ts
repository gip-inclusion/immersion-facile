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
  constructor(private emailValidationGateway: EmailValidationGetaway) {
    super();
  }
  protected inputSchema = validateEmailInputSchema;

  protected _execute({
    email,
  }: ValidateEmailInput): Promise<ValidateEmailStatus> {
    return this.emailValidationGateway.validateEmail(email);
  }
}
