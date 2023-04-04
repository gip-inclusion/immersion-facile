import {
  type EmailValidationQueryInput,
  type EmailValidationStatus,
  emailValidationTargets,
} from "shared";
import { type SuperTest, type Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryEmailValidationGateway } from "../../../secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";

const emailValidationUrl = (emailInput: EmailValidationQueryInput): string =>
  `${emailValidationTargets.getEmailStatus.url}?email=${emailInput}`;
describe("emailValidationRouter", () => {
  let request: SuperTest<Test>;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    request = testAppAndDeps.request;
    emailValidationGateway = testAppAndDeps.gateways.emailValidationGateway;
  });

  describe(`/email/validation route`, () => {
    const candidateEmail = "enguerran.weiss@beta.gouv.fr";
    const expectedStatus: EmailValidationStatus = {
      isValid: true,
      proposal: null,
      isFree: false,
      reason: "accepted_email",
    };

    it(`GET /email/validation?email=enguerran.weiss@beta.gouv.fr`, async () => {
      emailValidationGateway.setEmailValidationStatusResponse(expectedStatus);
      const response = await request.get(emailValidationUrl(candidateEmail));
      expect(response.body).toEqual(expectedStatus);
      expect(response.status).toBe(200);
    });
  });
});
