import {
  expectPromiseToFail,
  ValidateEmailInput,
  ValidateEmailStatus,
} from "shared";
import { InMemoryEmailValidationGateway } from "../../../adapters/secondary/emailValidationGateway/InMemoryEmailValidationGateway";
import { ValidateEmail } from "./ValidateEmail";

describe("Email validation status", () => {
  let validateEmail: ValidateEmail;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(() => {
    emailValidationGateway = new InMemoryEmailValidationGateway();
    validateEmail = new ValidateEmail(emailValidationGateway);
  });

  it("retrieve email validation status from queried email", async () => {
    const expectedEmailValidationStatus: ValidateEmailStatus = {
      isValid: true,
      proposal: null,
      reason: "invalid_smtp",
    };
    emailValidationGateway.setEmailValidationStatusResponse(
      expectedEmailValidationStatus,
    );
    const emailValidationInput: ValidateEmailInput = {
      email: "tom@jedusor.com",
    };
    const response = await validateEmail.execute(emailValidationInput);
    expect(response).toEqual(expectedEmailValidationStatus);
  });

  it("should throw an error", async () => {
    const emailValidationInput: ValidateEmailInput = {
      email: "ezfzemflkzmle",
    };
    await expectPromiseToFail(validateEmail.execute(emailValidationInput));
  });
});
