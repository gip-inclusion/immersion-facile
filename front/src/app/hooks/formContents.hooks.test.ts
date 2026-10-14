import type { FieldErrors } from "react-hook-form";
import { localization } from "shared";
import {
  displayReadableError,
  formErrorsToFlatErrors,
  makeFieldError,
} from "./formContents.hooks";

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
        contactMode: {
          message:
            "Invalid enum value. Expected 'EMAIL' | 'PHONE' | 'IN_PERSON'",
          type: "invalid_enum_value",
          ref: {
            type: "radio",
            name: "businessContact.contactMode",
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
        contactMode:
          "Invalid enum value. Expected 'EMAIL' | 'PHONE' | 'IN_PERSON'",
        email: "Veuillez saisir une adresse e-mail valide",
        address: {
          postcode: "Veuillez saisir un code postal valide",
        },
      },
    };

    expect(formErrorsToFlatErrors(formErrors)).toStrictEqual(expected);
  });

  describe("makeFieldError with AddressDto nested errors", () => {
    it("surfaces streetNumberAndAddress error on the parent address field", () => {
      const getFieldError = makeFieldError({
        errors: {
          signatories: {
            beneficiary: {
              address: {
                streetNumberAndAddress: {
                  message: localization.required,
                  type: "too_small",
                },
              },
            },
          },
        },
      });

      expect(getFieldError("signatories.beneficiary.address")).toEqual({
        state: "error",
        stateRelatedMessage: localization.invalidAddressMissingFields([
          "numéro et nom de rue",
        ]),
      });
    });

    it("lists all missing address fields with human-readable labels", () => {
      const getFieldError = makeFieldError({
        errors: {
          signatories: {
            beneficiary: {
              address: {
                streetNumberAndAddress: {
                  message: localization.required,
                  type: "too_small",
                },
                postcode: {
                  message: localization.required,
                  type: "too_small",
                },
                city: {
                  message: localization.required,
                  type: "too_small",
                },
              },
            },
          },
        },
      });

      expect(getFieldError("signatories.beneficiary.address")).toEqual({
        state: "error",
        stateRelatedMessage: localization.invalidAddressMissingFields([
          "numéro et nom de rue",
          "code postal",
          "ville",
        ]),
      });
    });

    it("keeps an error already set on the parent address field", () => {
      const getFieldError = makeFieldError({
        errors: {
          signatories: {
            beneficiary: {
              address: {
                message: localization.invalidBeneficiaryAddress,
                type: "custom",
              },
            },
          },
        },
      });

      expect(getFieldError("signatories.beneficiary.address")).toEqual({
        state: "error",
        stateRelatedMessage: localization.invalidBeneficiaryAddress,
      });
    });
  });

  describe("displayReadableError with AddressDto nested errors", () => {
    it("collapses nested address field errors to the parent address path", () => {
      const errors = {
        businessContact: {
          address: {
            postcode: {
              message: localization.invalidPostalCode,
              type: "invalid_string",
            },
          },
        },
      };

      expect(displayReadableError(errors)).toStrictEqual({
        "businessContact.address": localization.invalidAddressMissingFields([
          "code postal",
        ]),
      });
    });

    it("keeps an error already set on the parent address path", () => {
      const errors = {
        signatories: {
          beneficiary: {
            address: {
              message: localization.invalidAddress,
              type: "custom",
            },
          },
        },
      };

      expect(displayReadableError(errors)).toStrictEqual({
        "signatories.beneficiary.address": localization.invalidAddress,
      });
    });
  });
});
