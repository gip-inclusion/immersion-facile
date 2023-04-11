import { ValidateEmailStatus, ValidateEmailInput } from "shared";
import { InMemoryEmailValidationGateway } from "../../../adapters/secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";
import { ValidateEmail } from "./GetEmailValidationStatus";

describe("Email validation status", () => {
  let useCase: ValidateEmail;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(() => {
    emailValidationGateway = new InMemoryEmailValidationGateway();
    useCase = new ValidateEmail(emailValidationGateway);
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
    const response = await useCase.execute(emailValidationInput);
    expect(response).toEqual(expectedEmailValidationStatus);
  });
});
