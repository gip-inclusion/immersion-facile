import {
  ConventionMagicLinkPayload,
  createConventionMagicLinkPayload,
  decodeJwtWithoutSignatureCheck,
  expectToEqual,
  GenerateMagicLinkRequestDto,
  Role,
} from "shared";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import {
  GenerateMagicLinkJwt,
  makeGenerateJwtES256,
} from "../../../domain/auth/jwt";
import { GenerateMagicLink } from "../../../domain/convention/useCases/GenerateMagicLink";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";

const generateJwtFn: GenerateMagicLinkJwt = (payload) => {
  const { applicationId, role, iat } = payload as ConventionMagicLinkPayload;
  return applicationId + ";" + role + ";" + iat;
};

describe("Generate magic links", () => {
  describe("Magic link generator use case", () => {
    it("Generates magic links with its fn", async () => {
      const id = "123";
      const role = "validator" as Role;
      const email = "foo@bar.com";
      const timeGateway = new CustomTimeGateway();
      const result = await new GenerateMagicLink(
        generateJwtFn,
        timeGateway,
      ).execute({
        applicationId: id,
        role,
        expired: false,
      });

      expect(result).toEqual({
        jwt: generateJwtFn(
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
        applicationId: "123",
        role: "validator",
        expired: false,
      };
      const result = await new GenerateMagicLink(
        makeGenerateJwtES256(new AppConfigBuilder({}).build().apiJwtPrivateKey),
        new CustomTimeGateway(new Date("2022-12-20T00:00:00.000Z")),
      ).execute(request);

      expectToEqual(
        decodeJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(result.jwt),
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
