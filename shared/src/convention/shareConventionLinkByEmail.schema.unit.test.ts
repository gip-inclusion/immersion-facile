import { expectToEqual } from "../test.helpers";
import { conventionCommonSchema } from "./convention.schema";
import { makeSchemaPartial, type ShareConventionLinkByEmailDto } from "./shareConventionLinkByEmail.dto";
import { shareConventionLinkByEmailSchema } from "./shareConventionLinkByEmail.schema";

describe("shareConventionLinkByEmailSchema schema validation", () => {
  it("accepts valid data", () => {
    const data: ShareConventionLinkByEmailDto = {
      senderEmail: "test@test.com",
      details: "",
      recipientEmail: "",
      convention: {},
    };

    expectToEqual(shareConventionLinkByEmailSchema.parse(data), data);
  });
});

describe("makeSchemaPartial", () => {
  it("makes the schema partial", () => {
    const result = conventionCommonSchema.safeParse({
      immersionAddress: "17 rue de la paix, 75000 Paris",
    });

    console.log(result.error);
    expect(result.success).toBeTruthy();
  });
});