import { SuperTest, Test } from "supertest";
import { ConventionDtoBuilder, conventionsRoute } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import {
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
} from "../../../../domain/auth/jwt";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const payloadMeta = {
  exp: new Date().getTime() / 1000 + 1000,
  iat: new Date().getTime() / 1000,
  version: 1,
};

const conventionBuilder = new ConventionDtoBuilder().withStatus("DRAFT");

describe("POST /auth/demande-immersion/:conventionId", () => {
  let request: SuperTest<Test>;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let generateConventionJwt: GenerateConventionJwt;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, generateBackOfficeJwt, generateConventionJwt, inMemoryUow } =
      await buildTestApp());
    const initialConvention = conventionBuilder.build();
    inMemoryUow.conventionRepository.setConventions({
      [initialConvention.id]: initialConvention,
    });
  });

  describe("when beneficiary asks for modification", () => {
    it("can update the convention", async () => {
      const updatedConvention = conventionBuilder
        .withBeneficiaryFirstName("Merguez")
        .withStatus("READY_TO_SIGN")
        .withStatusJustification("justif")
        .build();

      const backOfficeJwt = generateConventionJwt({
        ...payloadMeta,
        role: "beneficiary",
        emailHash: "my-hash",
        applicationId: updatedConvention.id,
      });
      const response = await request
        .post(`/auth/${conventionsRoute}/${updatedConvention.id}`)
        .send({
          convention: updatedConvention,
        })
        .set({
          authorization: backOfficeJwt,
        });

      expect(response.body).toEqual({ id: updatedConvention.id });
      expect(response.status).toBe(200);
    });
  });

  describe("when admin sends modifiaction requests", () => {
    it("works fine", async () => {
      const updatedConvention = conventionBuilder
        .withBeneficiaryFirstName("Merguez")
        .withStatus("READY_TO_SIGN")
        .withStatusJustification("Justif")
        .build();

      const backOfficeJwt = generateBackOfficeJwt({
        ...payloadMeta,
        role: "backOffice",
        sub: "admin",
      });
      const response = await request
        .post(`/auth/${conventionsRoute}/${updatedConvention.id}`)
        .send({
          convention: updatedConvention,
        })
        .set({
          authorization: backOfficeJwt,
        });

      expect(response.body).toEqual({ id: updatedConvention.id });
      expect(response.status).toBe(200);
    });
  });
});
