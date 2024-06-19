import { z } from "zod";
import {
  DiagorienteAccessTokenResponse,
  DiagorienteRawResponse,
  DiagorienteResultData,
} from "./DiagorienteAppellationsGateway.routes";

export const diagorienteQueryParamsSchema = z.object({
  query: z.string(),
  nb_results: z.number(),
  tags: z
    .array(z.enum(["ROME4", "alternance"]))
    .min(1)
    .optional(),
});

const data: z.Schema<DiagorienteResultData> = z.object({
  titre: z.string(),
  code_ogr: z.string(),
});

export const diagorienteRawResponseSchema: z.Schema<DiagorienteRawResponse> =
  z.object({
    search_results: z.array(
      z.object({
        text: z.string(),
        similarity: z.number(),
        data: data,
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
