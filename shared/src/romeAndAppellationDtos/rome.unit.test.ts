import {
  appellationCodeSchema,
  appellationCodeSchemaOptional,
  appellationDtoSchema,
} from "./romeAndAppellation.schema";

describe("appel", () => {
  it("must include rome code and can include appellation", () => {
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

describe("appellationSchema", () => {
  it("should validate appellation with 5 digits", () => {
    expect(() => appellationCodeSchema.parse("55555")).not.toThrow();
  });

  it("should validate appellation with 6 digits", () => {
    expect(() => appellationCodeSchema.parse("666666")).not.toThrow();
  });

  it("should not validate appellation with 4 digits", () => {
    expect(() => appellationCodeSchema.parse("4444")).toThrow();
  });

  it("should not validate appellation with 7 digits", () => {
    expect(() => appellationCodeSchema.parse("7777777")).toThrow();
  });

  it("should not validate appellation with letters", () => {
    expect(() => appellationCodeSchema.parse("appellation")).toThrow();
  });

  describe("appellationSchemaOptional", () => {
    it("should validate appellation with 5 digits", () => {
      expect(() => appellationCodeSchemaOptional.parse("55555")).not.toThrow();
    });

    it("should validate appellation with 6 digits", () => {
      expect(() => appellationCodeSchemaOptional.parse("666666")).not.toThrow();
    });

    it("should not validate appellation with 4 digits", () => {
      expect(() => appellationCodeSchemaOptional.parse("4444")).toThrow();
    });

    it("should not validate appellation with 7 digits", () => {
      expect(() => appellationCodeSchemaOptional.parse("7777777")).toThrow();
    });

    it("should not validate appellation with letters", () => {
      expect(() =>
        appellationCodeSchemaOptional.parse("appellation"),
      ).toThrow();
    });

    it("should validate optional appellation with undefined values", () => {
      expect(() =>
        appellationCodeSchemaOptional.parse(undefined),
      ).not.toThrow();
    });
  });
});
