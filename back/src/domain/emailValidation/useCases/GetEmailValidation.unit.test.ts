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
      accept_all: false,
      did_you_mean: null,
      disposable: false,
      domain: "jedusor.com",
      duration: 0.0,
      email: "tom@jedusor.com",
      first_name: null,
      free: false,
      full_name: null,
      gender: null,
      last_name: null,
      mailbox_full: false,
      mx_record: "mx.zoho.com",
      no_reply: false,
      reason: "invalid_smtp",
      role: false,
      score: 0,
      smtp_provider: "Zoho",
      state: "undeliverable",
      tag: null,
      user: "tom",
    };
    emailValidationGateway.setEmailValidationStatusResponse(
      expectedEmailValidationStatus,
    );
    const emailValidationInput: WithEmailInput = { email: "tom@jedusor.com" };
    const response = await useCase.execute(emailValidationInput);
    expect(response).toEqual(expectedEmailValidationStatus);
  });
});
