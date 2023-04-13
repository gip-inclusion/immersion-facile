import { FieldErrors } from "react-hook-form";

import { formErrorsToFlatErrors } from "./formContents.hooks";

describe("form contents utils", () => {
  it("formErrorsToFlatErrors", () => {
    const formErrors: Partial<FieldErrors<any>> = {
      appellations: {
        message: "Vous devez renseigner au moins un métier",
        type: "too_small",
      },
      businessContact: {
        firstName: {
          message: "Obligatoire",
          type: "too_small",
          ref: undefined,
        },
        job: {
          message: "Obligatoire",
          type: "too_small",
          ref: undefined,
        },
        phone: {
          message: "Obligatoire",
          type: "too_small",
          ref: undefined,
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
          ref: undefined,
        },
        address: {
          postcode: {
            message: "Veuillez saisir un code postal valide",
            type: "invalid_string",
            ref: undefined,
          },
        },
      },
    };
    const expected = {
      appellations: "Vous devez renseigner au moins un métier",
      businessContact: {
        firstName: "Obligatoire",
        job: "Obligatoire",
        phone: "Obligatoire",
        contactMethod:
          "Invalid enum value. Expected 'EMAIL' | 'PHONE' | 'IN_PERSON'",
        email: "Veuillez saisir une adresse e-mail valide",
        address: {
          postcode: "Veuillez saisir un code postal valide",
        },
      },
    };

    expect(formErrorsToFlatErrors(formErrors)).toStrictEqual(expected);
  });
});
