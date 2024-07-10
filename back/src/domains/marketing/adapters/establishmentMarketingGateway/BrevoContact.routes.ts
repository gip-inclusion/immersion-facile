import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { apiBrevoUrl, brevoHeaderSchema } from "../../../../utils/apiBrevoUrl";
import {
  contactErrorResponseBodySchema,
  createContactBodySchema,
  deleteContactFromListBodyRequestModeEmailSchema,
  deleteContactFromListModeEmailResponseBodySchema,
  getContactInfoResponseBodySchema,
} from "./BrevoContact.schema";

export type BrevoContactRoutes = typeof brevoContactRoutes;

export const brevoContactRoutes = defineRoutes({
  getContact: defineRoute({
    method: "get",
    url: `${apiBrevoUrl}/contacts/:identifier`,
    headersSchema: brevoHeaderSchema,
    responses: {
      200: getContactInfoResponseBodySchema,
      400: contactErrorResponseBodySchema,
      404: contactErrorResponseBodySchema,
    },
  }),
  createContact: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/contacts`,
    requestBodySchema: createContactBodySchema,
    headersSchema: brevoHeaderSchema,
    responses: {
      201: z.object({ id: z.number().int() }),
      204: z.string(),
      400: contactErrorResponseBodySchema,
      425: contactErrorResponseBodySchema,
    },
  }),
  deleteContact: defineRoute({
    method: "delete",
    url: `${apiBrevoUrl}/contacts/:identifier`,
    headersSchema: brevoHeaderSchema,
    responses: {
      204: z.string(),
      400: contactErrorResponseBodySchema,
      405: contactErrorResponseBodySchema,
      425: contactErrorResponseBodySchema,
    },
  }),
  deleteContactFromList: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/contacts/lists/:listId/contacts/remove`,
    headersSchema: brevoHeaderSchema,
    requestBodySchema: deleteContactFromListBodyRequestModeEmailSchema,
    responses: {
      201: deleteContactFromListModeEmailResponseBodySchema,
      400: contactErrorResponseBodySchema,
      404: contactErrorResponseBodySchema,
    },
  }),
});
