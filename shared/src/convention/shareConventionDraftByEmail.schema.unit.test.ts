import { expectToEqual } from "../test.helpers";
import type {
  ConventionDraftDto,
  ShareConventionDraftByEmailDto,
} from "./shareConventionDraftByEmail.dto";
import {
  conventionDraftSchema,
  shareConventionDraftByEmailSchema,
} from "./shareConventionDraftByEmail.schema";

describe("shareConventionLinkByEmailSchema schema validation", () => {
  it("accepts valid data", () => {
    const convention: ConventionDraftDto = {};

    const data: ShareConventionDraftByEmailDto = {
      senderEmail: "test@test.com",
      details: "",
      recipientEmail: "",
      convention,
    };

    expectToEqual(shareConventionDraftByEmailSchema.parse(data), data);
  });
});

describe("sharedConventionSchema schema validation", () => {
  it.each([
    {
      immersionAddress: "17 rue de la paix, 75000 Paris",
    } satisfies ConventionDraftDto,
    {
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          email: "beneficiary@test.com",
        },
      },
    } satisfies ConventionDraftDto,
    {
      internshipKind: "immersion",
      signatories: {
        establishmentRepresentative: {
          phone: "",
        },
      },
    } satisfies ConventionDraftDto,
  ])("makes the schema partial", (convention: ConventionDraftDto) => {
    const result = conventionDraftSchema.safeParse(convention);

    expect(result.success).toBeTruthy();
  });
});
