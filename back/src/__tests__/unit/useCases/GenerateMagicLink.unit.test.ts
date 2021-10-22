import { GenerateJwtFn } from "./../../../domain/auth/jwt";
import { GenerateMagicLink } from "./../../../domain/immersionApplication/useCases/GenerateMagicLink";
import {
  createMagicLinkPayload,
  Role,
  MagicLinkPayload,
} from "../../../shared/tokens/MagicLinkPayload";

const generateJwtFn: GenerateJwtFn = (payload: MagicLinkPayload) => {
  return payload.applicationId + "; " + payload.roles.join(",");
};

describe("Generate magic links", () => {
  let generateMagicLink: GenerateMagicLink;

  describe("Magic link generator use case", () => {
    beforeEach(() => {
      generateMagicLink = new GenerateMagicLink(generateJwtFn);
    });

    test("Generates magic links with its fn", async () => {
      const id = "123";
      const role = "validator" as Role;

      const result = await generateMagicLink.execute({
        applicationId: id,
        role,
      });

      expect(result).toEqual({
        jwt: generateJwtFn(createMagicLinkPayload(id, role)),
      });
    });
  });
});
