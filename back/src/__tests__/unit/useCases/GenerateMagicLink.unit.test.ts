import { GenerateMagicLinkJwt } from "../../../domain/auth/jwt";
import { GenerateMagicLink } from "../../../domain/immersionApplication/useCases/GenerateMagicLink";
import {
  createMagicLinkPayload,
  MagicLinkPayload,
  Role,
} from "../../../shared/tokens/MagicLinkPayload";

const generateJwtFn: GenerateMagicLinkJwt = (payload) => {
  const { applicationId, role, iat } = payload as MagicLinkPayload;
  return applicationId + ";" + role + ";" + iat;
};

describe("Generate magic links", () => {
  let generateMagicLink: GenerateMagicLink;

  describe("Magic link generator use case", () => {
    beforeEach(() => {
      generateMagicLink = new GenerateMagicLink(generateJwtFn);
    });

    it("Generates magic links with its fn", async () => {
      const id = "123";
      const role = "validator" as Role;
      const email = "foo@bar.com";

      const result = await generateMagicLink.execute({
        applicationId: id,
        role,
        expired: false,
      });

      expect(result).toEqual({
        jwt: generateJwtFn(createMagicLinkPayload(id, role, email)),
      });
    });
  });
});
