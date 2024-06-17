import { z } from "zod";
import {
  DiagorienteAccessTokenResponse,
  DiagorienteRawResponse,
} from "./DiagorienteAppellationsGateway.routes";

export const diagorienteQueryParamsSchema = z.object({
  query: z.string(),
  nb_results: z.number(),
  tags: z
    .array(z.enum(["ROME4", "alternance"]))
    .min(1)
    .optional(),
});

export const diagorienteRawResponseSchema: z.Schema<DiagorienteRawResponse> =
  z.object({
    search_results: z.array(
      z.object({
        text: z.string(),
        similarity: z.number(),
        data: z.object({
          _key: z.string(),
          _id: z.string(),
          _rev: z.string(),
          titre: z.string(),
          tags: z.array(z.unknown()),
          code_ogr: z.string(),
          transition_ecologique: z.boolean(),
          transition_numerique: z.boolean(),
          transition_demographique: z.boolean(),
          metier_avenir: z.boolean(),
          metier_art: z.boolean(),
          metier_en_tension: z.boolean(),
          metier_resilience: z.boolean(),
          principale: z.boolean(),
          description: z.null(),
          id: z.string(),
        }),
      }),
    ),
  });

export const diagorienteAccessTokenResponseSchema: z.Schema<DiagorienteAccessTokenResponse> =
  z.object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_expires_in: z.number(),
    token_type: z.string(),
    "not-before-policy": z.number(),
    scope: z.string(),
  });

export const diagorienteAccessTokenQueryParamsSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  grant_type: z.literal("client_credentials"),
});
