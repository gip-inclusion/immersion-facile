import { expectToEqual } from "../test.helpers";
import type {
  ShareConventionLinkByEmailDto,
  SharedConventionDto,
} from "./shareConventionLinkByEmail.dto";
import {
  shareConventionLinkByEmailSchema,
  sharedConventionSchema,
} from "./shareConventionLinkByEmail.schema";

describe("shareConventionLinkByEmailSchema schema validation", () => {
  it("accepts valid data", () => {
    const convention: SharedConventionDto = {};

    const data: ShareConventionLinkByEmailDto = {
      senderEmail: "test@test.com",
      details: "",
      recipientEmail: "",
      convention,
    };

    expectToEqual(shareConventionLinkByEmailSchema.parse(data), data);
  });
});

describe("sharedConventionSchema schema validation", () => {
  it.each([
    {
      immersionAddress: "17 rue de la paix, 75000 Paris",
    } satisfies SharedConventionDto,
    {
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          email: "beneficiary@test.com",
        },
      },
    } satisfies SharedConventionDto,
    {
      internshipKind: "immersion",
      signatories: {
        establishmentRepresentative: {
          phone: "",
        },
      },
    } satisfies SharedConventionDto,
  ])("makes the schema partial", (convention: SharedConventionDto) => {
    const result = sharedConventionSchema.safeParse(convention);

    expect(result.success).toBeTruthy();
  });
});
