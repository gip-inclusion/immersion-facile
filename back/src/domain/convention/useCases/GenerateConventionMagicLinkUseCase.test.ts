import {
  ConventionJwtPayload,
  createConventionMagicLinkPayload,
  decodeJwtWithoutSignatureCheck,
  expectToEqual,
  GenerateMagicLinkRequestDto,
  Role,
} from "shared";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import { generateConventionJwtTestFn } from "../../../_testBuilders/jwtTestHelper";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { makeGenerateJwtES256 } from "../../auth/jwt";
import { GenerateConventionMagicLinkUseCase } from "./GenerateConventionMagicLinkUseCase";

describe("Generate magic links", () => {
  describe("Magic link generator use case", () => {
    it("Generates magic links with its fn", async () => {
      const id = "add5c20e-6dd2-45af-affe-927358005251";
      const role = "validator" as Role;
      const email = "foo@bar.com";
      const timeGateway = new CustomTimeGateway();
      const result = await new GenerateConventionMagicLinkUseCase(
        generateConventionJwtTestFn,
        timeGateway,
      ).execute({
        applicationId: id,
        role,
        expired: false,
      });

      expect(result).toEqual({
        jwt: generateConventionJwtTestFn(
          createConventionMagicLinkPayload({
            id,
            role,
            email,
            now: timeGateway.now(),
          }),
        ),
      });
    });

    it("Decode convention magic link", async () => {
      const request: GenerateMagicLinkRequestDto = {
        applicationId: "20f44402-80f9-42ad-9f53-9353cb2629ee",
        role: "validator",
        expired: false,
      };
      const result = await new GenerateConventionMagicLinkUseCase(
        makeGenerateJwtES256<"convention">(
          new AppConfigBuilder({}).build().apiJwtPrivateKey,
          undefined,
        ),
        new CustomTimeGateway(new Date("2022-12-20T00:00:00.000Z")),
      ).execute(request);

      expectToEqual(
        decodeJwtWithoutSignatureCheck<ConventionJwtPayload>(result.jwt),
        {
          applicationId: request.applicationId,
          role: request.role,
          emailHash: "61470e490d95f8bd8b0923cb9d599728",
          version: 1,
          exp: 1674172800,
          iat: 1671494400,
        },
      );
    });
  });
});
