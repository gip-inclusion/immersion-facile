import {
  expectPromiseToFail,
  type ValidateEmailFeedback,
  type ValidateEmailInput,
} from "shared";
import { InMemoryEmailValidationGateway } from "../adapters/InMemoryEmailValidationGateway";
import { makeValidateEmail, type ValidateEmail } from "./ValidateEmail";

describe("Email validation status", () => {
  let validateEmail: ValidateEmail;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(() => {
    emailValidationGateway = new InMemoryEmailValidationGateway();
    validateEmail = makeValidateEmail({ deps: { emailValidationGateway } });
  });

  it("retrieve email validation status from queried email", async () => {
    const expectedEmailValidationStatus: ValidateEmailFeedback = {
      status: "invalid_smtp",
      proposal: null,
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
