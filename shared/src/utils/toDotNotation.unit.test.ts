import { toDotNotation } from "./toDotNotation";

describe("toDotNotation utils", () => {
  it("should transform a nested object to a flat object using dot notation", () => {
    const sample = {
      foo: {
        a: "hey",
        b: "ho",
      },
      bar: "let's go!",
    };
    const expected = {
      bar: "let's go!",
      "foo.a": "hey",
      "foo.b": "ho",
    };
    expect(toDotNotation(sample)).toStrictEqual(expected);
  });
  it("should transform a nested object to a flat object using dot notation on a form errors object", () => {
    const sample = {
      siret: "Obligatoire",
      businessAddress: "Veuillez spécifier un code postal dans l'adresse.",
      businessContact: {
        email: "Required",
      },
    };
    const expected = {
      siret: "Obligatoire",
      businessAddress: "Veuillez spécifier un code postal dans l'adresse.",
      "businessContact.email": "Required",
    };
    expect(toDotNotation(sample)).toStrictEqual(expected);
  });
  it("should do nothing on a flat object", () => {
    const sample = {
      foo: "hey",
      bar: "ho",
    };
    const expected = {
      bar: "ho",
      foo: "hey",
    };
    expect(toDotNotation(sample)).toStrictEqual(expected);
  });
});
