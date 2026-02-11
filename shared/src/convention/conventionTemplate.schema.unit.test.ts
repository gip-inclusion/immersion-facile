import { expectToEqual } from "../test.helpers";
import { ConventionDtoBuilder } from "./ConventionDtoBuilder";
import type {
  ConventionTemplate,
  ConventionTemplateId,
} from "./conventionTemplate.dto";
import { conventionTemplateSchema } from "./conventionTemplate.schema";

const validConventionDto = new ConventionDtoBuilder().build();
const validTemplateId =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as ConventionTemplateId;

describe("conventionTemplateSchema", () => {
  it("accepts valid ConventionTemplate with full convention data", () => {
    const data: ConventionTemplate = {
      ...validConventionDto,
      id: validTemplateId,
      name: "Mon modèle",
      userId: "user-id",
    };
    expectToEqual(conventionTemplateSchema.parse(data), data);
  });

  it.each([
    {
      id: validTemplateId,
      userId: "user-id",
      name: "Template immersion",
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          email: "beneficiary@test.com",
        },
      },
    },
    {
      id: validTemplateId,
      userId: "user-id",
      name: "Template mini-stage",
      internshipKind: "mini-stage-cci",
      signatories: {
        beneficiary: {
          schoolName: "Lycée Victor Hugo",
          streetNumberAndAddress: "17 rue de la paix, 75000 Paris",
          postcode: "75000",
          departmentCode: "75",
          city: "Paris",
        },
      },
    },
  ])("accepts valid partial convention template", (template) => {
    expect(() => conventionTemplateSchema.parse(template)).not.toThrow();
  });

  it.each([
    {
      id: validTemplateId,
      userId: "user-id",
      name: "",
      internshipKind: "immersion",
    },
    {
      id: "not-a-uuid",
      userId: "user-id",
      name: "Valid name",
      internshipKind: "immersion",
    },
    {
      id: validTemplateId,
      userId: "user-id",
      name: "Valid name",
      internshipKind: "immersion",
      signatories: {
        beneficiary: {
          levelOfEducation: "1ère",
        },
      },
    },
    {
      id: validTemplateId,
      userId: "user-id",
      name: "Valid name",
      internshipKind: "invalid",
    },
  ])("rejects invalid convention template", (data) => {
    expect(() => conventionTemplateSchema.parse(data)).toThrow();
  });
});
