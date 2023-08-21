import { createTarget, createTargets } from "http-client";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withValidateHeadersAuthorization } from "../headers";

const formEstablishmentsUrl = "/form-establishments";

export type EstablishmentTargets = typeof establishmentTargets;
export const establishmentTargets = createTargets({
  addFormEstablishment: createTarget({
    method: "POST",
    url: formEstablishmentsUrl,
    validateRequestBody: formEstablishmentSchema.parse,
  }),
  updateFormEstablishment: createTarget({
    method: "PUT",
    url: formEstablishmentsUrl,
    validateRequestBody: formEstablishmentSchema.parse,
    ...withValidateHeadersAuthorization,
  }),
  getFormEstablishment: createTarget({
    method: "GET",
    url: `${formEstablishmentsUrl}/:siret`,
    ...withValidateHeadersAuthorization,
    validateResponseBody: formEstablishmentSchema.parse,
  }),
  requestEmailToUpdateFormRoute: createTarget({
    method: "POST",
    url: "/request-email-to-update-form/:siret",
  }),
  deleteEstablishment: createTarget({
    method: "DELETE",
    url: `${formEstablishmentsUrl}/:siret`,
    ...withValidateHeadersAuthorization,
  }),
});
