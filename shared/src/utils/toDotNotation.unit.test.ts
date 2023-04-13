import { localization } from "../zodUtils";
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
      siret: localization.required,
      businessAddress: "Veuillez spécifier un code postal dans l'adresse.",
      businessContact: {
        email: "Required",
      },
    };
    const expected = {
      siret: localization.required,
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

  it("should flatten react-hook-form errors object", () => {
    const data = {
      appellations: {
        message: "Vous devez renseigner au moins un métier",
        type: "too_small",
      },
      businessContact: {
        firstName: {
          message: "Obligatoire",
          type: "too_small",
          ref: {},
        },
        job: {
          message: "Obligatoire",
          type: "too_small",
          ref: {},
        },
        phone: {
          message: "Obligatoire",
          type: "too_small",
          ref: {},
        },
        contactMethod: {
          message:
            "Invalid enum value. Expected 'EMAIL' | 'PHONE' | 'IN_PERSON'",
          type: "invalid_enum_value",
          ref: {
            type: "radio",
            name: "businessContact.contactMethod",
          },
        },
        email: {
          message: "Veuillez saisir une adresse e-mail valide",
          type: "invalid_string",
          ref: {},
        },
      },
    };

    const expected = {
      "appellations.message": "Vous devez renseigner au moins un métier",
      "appellations.type": "too_small",
      "businessContact.firstName.message": "Obligatoire",
      "businessContact.firstName.type": "too_small",
      "businessContact.job.message": "Obligatoire",
      "businessContact.job.type": "too_small",
      "businessContact.phone.message": "Obligatoire",
      "businessContact.phone.type": "too_small",
      "businessContact.contactMethod.message":
        "Invalid enum value. Expected 'EMAIL' | 'PHONE' | 'IN_PERSON'",
      "businessContact.contactMethod.type": "invalid_enum_value",
      "businessContact.contactMethod.ref.type": "radio",
      "businessContact.contactMethod.ref.name": "businessContact.contactMethod",
      "businessContact.email.message":
        "Veuillez saisir une adresse e-mail valide",
      "businessContact.email.type": "invalid_string",
    };
    expect(toDotNotation(data)).toStrictEqual(expected);
  });
});
