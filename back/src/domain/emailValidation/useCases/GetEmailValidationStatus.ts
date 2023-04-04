import {
  emailValidationInputSchema,
  WithEmailInput,
  type EmailValidationStatus,
} from "shared";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";

export class GetEmailValidationStatus extends UseCase<
  WithEmailInput,
  EmailValidationStatus
> {
  constructor(private emailValidationGateway: EmailValidationGetaway) {
    super();
  }
  protected inputSchema: ZodType<WithEmailInput, ZodTypeDef, WithEmailInput> =
    emailValidationInputSchema;

  protected _execute(params: WithEmailInput): Promise<EmailValidationStatus> {
    return this.emailValidationGateway.getEmailStatus(params.email);
  }
}
