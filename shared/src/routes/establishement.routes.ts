import { defineRoute, defineRoutes } from "shared-routes";
import { renewMagicLinkResponseSchema } from "../convention/convention.schema";
import {
  discussionExchangeForbiddenParamsSchema,
  discussionReadSchema,
  exchangeReadSchema,
  flatGetPaginatedDiscussionsParamsSchema,
  paginatedDiscussionListSchema,
  withDiscussionStatusSchema,
  withExchangeMessageSchema,
} from "../discussion/discussion.schema";
import { establishmentNameAndAdminsSchema } from "../establishment/establishment";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { emptyObjectSchema, expressEmptyResponseBody } from "../zodUtils";

export type EstablishmentRoutes = typeof establishmentRoutes;

export const establishmentRoutes = defineRoutes({
  addFormEstablishment: defineRoute({
    method: "post",
    url: "/form-establishments",
    requestBodySchema: formEstablishmentSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
    },
  }),
  updateFormEstablishment: defineRoute({
    method: "put",
    url: "/form-establishments",
    requestBodySchema: formEstablishmentSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      409: httpErrorSchema,
    },
  }),
  getFormEstablishment: defineRoute({
    method: "get",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      200: formEstablishmentSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
  deleteEstablishment: defineRoute({
    method: "delete",
    url: "/form-establishments/:siret",
    ...withAuthorizationHeaders,
    responses: {
      204: emptyObjectSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: renewMagicLinkResponseSchema,
      404: httpErrorSchema,
    },
  }),
  getEstablishmentNameAndAdmins: defineRoute({
    method: "get",
    url: "/establishments/:siret/nameAndAdmins",
    ...withAuthorizationHeaders,
    responses: {
      200: establishmentNameAndAdminsSchema,
      404: httpErrorSchema,
    },
  }),
  getDiscussions: defineRoute({
    method: "get",
    url: "/discussions",
    ...withAuthorizationHeaders,
    queryParamsSchema: flatGetPaginatedDiscussionsParamsSchema,
    responses: {
      200: paginatedDiscussionListSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
    },
  }),
  getDiscussionByIdForEstablishment: defineRoute({
    method: "get",
    url: "/discussion-for-establishment/:discussionId",
    ...withAuthorizationHeaders,
    responses: {
      200: discussionReadSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  updateDiscussionStatus: defineRoute({
    method: "patch",
    url: "/discussion-for-establishment/:discussionId",
    ...withAuthorizationHeaders,
    requestBodySchema: withDiscussionStatusSchema,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  replyToDiscussion: defineRoute({
    method: "post",
    url: "/discussion-for-establishment/:discussionId/send-message",
    ...withAuthorizationHeaders,
    requestBodySchema: withExchangeMessageSchema,
    responses: {
      200: exchangeReadSchema,
      202: discussionExchangeForbiddenParamsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
