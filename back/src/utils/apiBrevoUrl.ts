import { AbsoluteUrl, Flavor } from "shared";
import { z } from "zod";

export const apiBrevoUrl: AbsoluteUrl = "https://api.sendinblue.com/v3";

export type ApiKey = Flavor<string, "ApiKey">;
const apiKeySchema = z.string().nonempty();

type ApplicationJsonType = "application/json";
const applicationJsonSchema = z.literal("application/json");

type ApplicationOctetStreamType = "application/octet-stream";
const applicationOctetStreamSchema = z.literal("application/octet-stream");

export type BrevoHeaders = {
  accept: ApplicationJsonType;
  "Content-Type": ApplicationJsonType;
  "api-key": ApiKey;
};

type BrevoBinaryContentHeaders = {
  accept: ApplicationOctetStreamType;
  "api-key": ApiKey;
};

export const brevoHeaderSchema: z.Schema<BrevoHeaders> = z.object({
  accept: applicationJsonSchema,
  "Content-Type": applicationJsonSchema,
  "api-key": apiKeySchema,
});

export const brevoHeaderBinaryContentSchema: z.Schema<BrevoBinaryContentHeaders> =
  z.object({
    accept: applicationOctetStreamSchema,
    "api-key": apiKeySchema,
  });
