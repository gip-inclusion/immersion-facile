import { professionSchema } from "../../shared/rome";

describe("professionSchema", () => {
  test("must include exactly one code", () => {
    expect(() =>
      professionSchema.validateSync({
        romeCodeMetier: "A0000",
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).not.toThrowError();

    expect(() =>
      professionSchema.validateSync({
        romeCodeMetier: undefined,
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).not.toThrowError();

    expect(() =>
      professionSchema.validateSync({
        romeCodeMetier: "A0000",
        romeCodeAppellation: "00000",
        description: "description",
      }),
    ).toThrowError();

    expect(() =>
      professionSchema.validateSync({
        romeCodeMetier: undefined,
        romeCodeAppellation: undefined,
        description: "description",
      }),
    ).toThrowError();
  });
});
