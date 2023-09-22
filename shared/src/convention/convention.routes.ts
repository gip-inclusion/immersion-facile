import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAuthorizationHeaders } from "../headers";
import { shareLinkByEmailSchema } from "../ShareLinkByEmailDto";
import {
  conventionReadSchema,
  conventionSchema,
  renewConventionParamsSchema,
  renewMagicLinkRequestSchema,
  updateConventionRequestSchema,
  updateConventionStatusRequestSchema,
  withConventionIdLegacySchema,
} from "./convention.schema";

export type ConventionMagicLinkRoutes = typeof conventionMagicLinkRoutes;
export const conventionMagicLinkRoutes = defineRoutes({
  getConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "get",
    ...withAuthorizationHeaders,
    responses: { 200: conventionReadSchema },
  }),
  getConventionStatusDashboard: defineRoute({
    url: "/auth/status-convention",
    method: "get",
    ...withAuthorizationHeaders,
    responses: { 200: absoluteUrlSchema },
  }),
  signConvention: defineRoute({
    url: "/auth/sign-application/:conventionId",
    method: "post",
    ...withAuthorizationHeaders,
    responses: { 200: withConventionIdLegacySchema },
  }),
  updateConvention: defineRoute({
    url: "/auth/demandes-immersion/:conventionId",
    method: "post",
    requestBodySchema: updateConventionRequestSchema,
    ...withAuthorizationHeaders,
    responses: { 200: withConventionIdLegacySchema },
  }),
  updateConventionStatus: defineRoute({
    url: "/auth/update-application-status",
    method: "post",
    requestBodySchema: updateConventionStatusRequestSchema,
    ...withAuthorizationHeaders,
    responses: { 200: withConventionIdLegacySchema },
  }),
  renewConvention: defineRoute({
    url: "/auth/renew-convention",
    method: "post",
    requestBodySchema: renewConventionParamsSchema,
    ...withAuthorizationHeaders,
    responses: { 200: z.literal("") },
  }),
});

export type UnauthenticatedConventionRoutes =
  typeof unauthenticatedConventionRoutes;
export const unauthenticatedConventionRoutes = defineRoutes({
  createConvention: defineRoute({
    url: "/demandes-immersion",
    method: "post",
    requestBodySchema: conventionSchema,
    responses: {
      200: withConventionIdLegacySchema,
    },
  }),
  shareConvention: defineRoute({
    url: "/share-immersion-demand",
    method: "post",
    requestBodySchema: shareLinkByEmailSchema,
    responses: { 200: z.literal("") },
  }),
  renewMagicLink: defineRoute({
    url: "/renew-magic-link",
    method: "get",
    queryParamsSchema: renewMagicLinkRequestSchema,
    responses: { 200: z.literal("") },
  }),
});
