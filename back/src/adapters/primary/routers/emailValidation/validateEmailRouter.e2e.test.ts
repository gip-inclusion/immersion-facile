import {
  type Email,
  type ValidateEmailStatus,
  validateEmailsTargets,
} from "shared";
import { type SuperTest, type Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryEmailValidationGateway } from "../../../secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";

const emailValidationUrl = (emailInput: Email): string =>
  `${validateEmailsTargets.validateEmail.url}?email=${emailInput}`;
describe("validateEmailRouter", () => {
  let request: SuperTest<Test>;
  let emailValidationGateway: InMemoryEmailValidationGateway;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    request = testAppAndDeps.request;
    emailValidationGateway = testAppAndDeps.gateways.emailValidationGateway;
  });

  describe(`/validate-email route`, () => {
    const candidateEmail = "enguerran.weiss@beta.gouv.fr";
    const expectedStatus: ValidateEmailStatus = {
      isValid: true,
      proposal: null,
      reason: "accepted_email",
    };

    it(`GET /validate-email?email=enguerran.weiss@beta.gouv.fr`, async () => {
      emailValidationGateway.setEmailValidationStatusResponse(expectedStatus);
      const response = await request.get(emailValidationUrl(candidateEmail));
      expect(response.body).toEqual(expectedStatus);
      expect(response.status).toBe(200);
    });

    it('GET /validate-email?email="invalid-email"', async () => {
      const invalidEmail = "invalid-email";
      const response = await request.get(emailValidationUrl(invalidEmail));
      expect(response.status).toBe(400);
    });
  });
});
