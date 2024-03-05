import { z } from "zod";
import {
  DiagorienteAccessTokenResponse,
  DiagorienteRawResponse,
} from "./DiagorienteAppellationsGateway";

export const diagorienteQueryParamsSchema = z.object({
  query: z.string(),
  nb_results: z.number(),
});

export const diagorienteRawResponseSchema: z.Schema<DiagorienteRawResponse> =
  z.object({
    search_id: z.string(),
    original_query: z.array(z.string()),
    rewritten_query: z.array(z.string()),
    search_results: z.array(
      z.object({
        position: z.number(),
        item: z.object({
          type: z.string(),
          key: z.string(),
          _key: z.string(),
          titre: z.string(),
          rome: z.string(),
          code_ogr: z.string(),
          naf: z.array(z.string()),
          niveau: z.string(),
        }),
        score_matching: z.number(),
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
