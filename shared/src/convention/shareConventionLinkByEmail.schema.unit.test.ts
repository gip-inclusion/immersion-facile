import { expectToEqual } from "../test.helpers";
import { conventionCommonSchema } from "./convention.schema";
import type { ConventionPresentation } from "./conventionPresentation.dto";
import type { ShareConventionLinkByEmailDto } from "./shareConventionLinkByEmail.dto";
import {
  shareConventionLinkByEmailSchema,
  shareConventionSchema,
} from "./shareConventionLinkByEmail.schema";

describe("shareConventionLinkByEmailSchema schema validation", () => {
  it("accepts valid data", () => {
    const convention: Partial<ConventionPresentation> = {};

    const data: ShareConventionLinkByEmailDto = {
      senderEmail: "test@test.com",
      details: "",
      recipientEmail: "",
      convention,
    };

    expectToEqual(shareConventionLinkByEmailSchema.parse(data), data);
  });
});

describe("sharedConventionSchema", () => {
  it("makes the schema partial", () => {
    const convention: Partial<ConventionPresentation> = {
      immersionAddress: "17 rue de la paix, 75000 Paris",
    };

    const result = shareConventionSchema.safeParse(convention);

    expect(result.success).toBeTruthy();
  });

  it.skip("makes the schema partial", () => {
    const result = conventionCommonSchema.safeParse({
      immersionAddress: "17 rue de la paix, 75000 Paris",
    });

    expect(result.success).toBeTruthy();
  });
});
