import { createTarget, createTargets } from "http-client";
import {
  immersionOfferInputSchema,
  immersionOfferResponseSchema,
} from "../immersionOffer/immersionOffer.schema";

export type ImmersionOfferTargets = typeof immersionOfferTargets;

export const immersionOfferTargets = createTargets({
  getImmersionOffer: createTarget({
    method: "GET",
    url: "/immersion-offer",
    validateQueryParams: immersionOfferInputSchema.parse,
    validateResponseBody: immersionOfferResponseSchema.parse,
  }),
});
