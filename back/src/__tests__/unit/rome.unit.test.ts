import { appellationDtoSchema } from "../../shared/romeAndAppellationDtos/romeAndAppellation.schema";

describe("appel", () => {
  it("must include rome code and can inculde appellation", () => {
    expect(() =>
      appellationDtoSchema.parse({
        romeCode: "A0000",
        appellationCode: "00000",
        romeLabel: "description",
        appellationLabel: "description",
      }),
    ).not.toThrow();

    expect(() =>
      appellationDtoSchema.parse({
        romeCode: undefined,
        appellationCode: "00000",
        romeLabel: "description",
        appellationLabel: "description",
      }),
    ).toThrow();

    expect(() =>
      appellationDtoSchema.parse({
        romeCode: "A0000",
        appellationCode: "00000",
        romeLabel: "description",
        appellationLabel: "description",
      }),
    ).not.toThrow();

    expect(() =>
      appellationDtoSchema.parse({
        romeCode: undefined,
        appellationCode: undefined,
        romeLabel: "description",
        appellationLabel: "description",
      }),
    ).toThrow();
  });
});
