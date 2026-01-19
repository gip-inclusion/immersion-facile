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
    const convention: ConventionDraftDto = {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "immersion",
    };

    const data: ShareConventionDraftByEmailDto = {
      senderEmail: "test@test.com",
      conventionDraft: convention,
    };

    expectToEqual(shareConventionDraftByEmailSchema.parse(data), data);
  });
});

describe("conventionDraftSchema schema validation", () => {
  it.each([
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      immersionAddress: "17 rue de la paix, 75000 Paris",
      internshipKind: "immersion",
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          email: "beneficiary@test.com",
        },
      },
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "immersion",
      signatories: {
        establishmentRepresentative: {
          phone: undefined,
        },
      },
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "mini-stage-cci",
      signatories: {
        beneficiary: {
          address: {
            streetNumberAndAddress: "17 rue de la paix, 75000 Paris",
            postcode: "75000",
            departmentCode: "75",
            city: "Paris",
          },
        },
      },
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "mini-stage-cci",
      signatories: {
        beneficiary: {
          schoolName: "Lycée Victor Hugo",
        },
      },
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "mini-stage-cci",
      signatories: {
        beneficiary: {
          schoolPostcode: "75000",
        },
      },
    } satisfies ConventionDraftDto,
  ])("makes the schema partial", (convention: ConventionDraftDto) => {
    expect(() => conventionDraftSchema.parse(convention)).not.toThrow();
  });

  it.each([
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          levelOfEducation: "1ère",
        },
      },
    } satisfies ConventionDraftDto,
    {
      id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          address: {
            streetNumberAndAddress: "17 rue de la paix, 75000 Paris",
            postcode: "75000",
            departmentCode: "75",
            city: "Paris",
          },
        },
      },
    } satisfies ConventionDraftDto,
  ])("throws on invalid data", (convention: ConventionDraftDto) => {
    expect(() => conventionDraftSchema.parse(convention)).toThrow();
  });
});
