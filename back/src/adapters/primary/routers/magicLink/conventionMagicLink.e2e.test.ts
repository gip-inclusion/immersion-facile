import { addDays } from "date-fns";
import { SuperTest, Test } from "supertest";
import {
  ConventionDtoBuilder,
  ConventionId,
  conventionMagicLinkTargets,
  expectToEqual,
  RenewConventionParams,
  Role,
  ScheduleDtoBuilder,
} from "shared";
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

describe("Magic link router", () => {
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

  describe("POST /auth/demande-immersion/:conventionId", () => {
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
          .post(
            conventionMagicLinkTargets.updateConvention.url.replace(
              ":conventionId",
              updatedConvention.id,
            ),
          )
          .send({
            convention: updatedConvention,
          })
          .set({
            authorization: backOfficeJwt,
          });

        expectToEqual(response.body, { id: updatedConvention.id });
        expectToEqual(response.status, 200);
        expectToEqual(inMemoryUow.conventionRepository.conventions, [
          updatedConvention,
        ]);
      });
    });

    describe("when admin sends modification requests", () => {
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
          .post(
            conventionMagicLinkTargets.updateConvention.url.replace(
              ":conventionId",
              updatedConvention.id,
            ),
          )
          .send({
            convention: updatedConvention,
          })
          .set({
            authorization: backOfficeJwt,
          });

        expectToEqual(response.body, { id: updatedConvention.id });
        expectToEqual(response.status, 200);
        expectToEqual(inMemoryUow.conventionRepository.conventions, [
          updatedConvention,
        ]);
      });
    });
  });

  describe("POST /renew-convention", () => {
    const existingConvention = new ConventionDtoBuilder().build();
    const renewedConventionStartDate = addDays(
      new Date(existingConvention.dateEnd),
      1,
    );
    const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
    const renewedConventionParams: RenewConventionParams = {
      id: "11111111-1111-4111-1111-111111111111",
      dateStart: renewedConventionStartDate.toISOString(),
      dateEnd: renewedConventionEndDate.toISOString(),
      schedule: new ScheduleDtoBuilder()
        .withDateInterval({
          start: renewedConventionStartDate,
          end: renewedConventionEndDate,
        })
        .build(),
      renewed: {
        from: existingConvention.id,
        justification: "Il faut bien...",
      },
    };

    const createTokenForRole = ({
      role,
      conventionId,
    }: {
      role: Role;
      conventionId: ConventionId;
    }) =>
      generateConventionJwt({
        applicationId: conventionId,
        role,
        version: 1,
        iat: new Date().getTime() / 1000,
        exp: new Date().getTime() / 1000 + 1000,
        emailHash: "my-hash",
      });

    it("401 - Fails if no convention magic link token is provided", async () => {
      const response = await request.post(
        conventionMagicLinkTargets.renewConvention.url,
      );

      expectToEqual(response.status, 401);
      expectToEqual(response.body, { error: "forbidden: unauthenticated" });
    });

    it("403 - Fails if provided token does not have enough privileges", async () => {
      const response = await request
        .post(conventionMagicLinkTargets.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: createTokenForRole({
            role: "beneficiary",
            conventionId: existingConvention.id,
          }),
        });

      expectToEqual(response.body, {
        errors: "The role 'beneficiary' is not allowed to renew convention",
      });
      expectToEqual(response.status, 403);
    });

    it("400 - Fails if original convention is not ACCEPTED_BY_VALIDATOR", async () => {
      const response = await request
        .post(conventionMagicLinkTargets.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: createTokenForRole({
            role: "counsellor",
            conventionId: existingConvention.id,
          }),
        });

      expectToEqual(response.body, {
        errors: "This convention cannot be renewed, as it has status : 'DRAFT'",
      });
      expectToEqual(response.status, 400);
    });

    it("200 - Creates a convention with provided data", async () => {
      const existingConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
      inMemoryUow.conventionRepository.setConventions({
        [existingConvention.id]: existingConvention,
      });
      const renewedConventionStartDate = addDays(
        new Date(existingConvention.dateEnd),
        1,
      );
      const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
      const renewedConventionParams: RenewConventionParams = {
        id: "22222222-2222-4222-2222-222222222222",
        dateStart: renewedConventionStartDate.toISOString(),
        dateEnd: renewedConventionEndDate.toISOString(),
        schedule: new ScheduleDtoBuilder()
          .withReasonableScheduleInInterval({
            start: renewedConventionStartDate,
            end: renewedConventionEndDate,
          })
          .build(),
        renewed: {
          from: existingConvention.id,
          justification: "Il faut bien...",
        },
      };
      const response = await request
        .post(conventionMagicLinkTargets.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: generateConventionJwt({
            applicationId: existingConvention.id,
            role: "validator",
            version: 1,
            iat: new Date().getTime() / 1000,
            exp: new Date().getTime() / 1000 + 1000,
            emailHash: "my-hash",
          }),
        });

      expectToEqual(response.body, "");
      expectToEqual(response.status, 200);
      expectToEqual(inMemoryUow.conventionRepository.conventions, [
        existingConvention,
        {
          ...existingConvention,
          ...renewedConventionParams,
          status: "READY_TO_SIGN",
        },
      ]);
    });
  });
});
