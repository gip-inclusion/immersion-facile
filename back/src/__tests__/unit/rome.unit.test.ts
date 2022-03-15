import { professionSchema } from "../../shared/rome";

describe("professionSchema", () => {
  it("must include rome code and can inculde appellation", () => {
    expect(() =>
      professionSchema.parse({
        romeCodeMetier: "A0000",
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).not.toThrow();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: undefined,
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).toThrow();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: "A0000",
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).not.toThrow();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: undefined,
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).toThrow();
  });
});
