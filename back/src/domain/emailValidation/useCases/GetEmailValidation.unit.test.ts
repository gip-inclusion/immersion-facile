import { EmailValidationStatus, WithEmailInput } from "shared";
import { InMemoryEmailValidationGateway } from "../../../adapters/secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";
import { GetEmailValidationStatus } from "./GetEmailValidationStatus";

describe("Email validation status", () => {
  let useCase: GetEmailValidationStatus;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(() => {
    emailValidationGateway = new InMemoryEmailValidationGateway();
    useCase = new GetEmailValidationStatus(emailValidationGateway);
  });

  it("retrieve email validation status from queried email", async () => {
    const expectedEmailValidationStatus: EmailValidationStatus = {
      isValid: true,
      proposal: null,
      isFree: false,
      reason: "invalid_smtp",
    };
    emailValidationGateway.setEmailValidationStatusResponse(
      expectedEmailValidationStatus,
    );
    const emailValidationInput: WithEmailInput = { email: "tom@jedusor.com" };
    const response = await useCase.execute(emailValidationInput);
    expect(response).toEqual(expectedEmailValidationStatus);
  });
});
