import { professionSchema } from "../../shared/rome";

describe("professionSchema", () => {
  test("must include at least one code", () => {
    expect(() =>
      professionSchema.parse({
        romeCodeMetier: "A0000",
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).not.toThrowError();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: undefined,
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).not.toThrowError();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: "A0000",
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).not.toThrowError();

    expect(() =>
      professionSchema.parse({
        romeCodeMetier: undefined,
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).toThrowError();
  });
});
