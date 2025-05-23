import { makezTrimmedString } from "shared";
import { z } from "zod";
import type { ExternalAccessToken } from "../adapters/ft-connect-gateway/ftConnectApi.dto";

export const externalAccessTokenSchema: z.Schema<ExternalAccessToken> =
  z.object({
    access_token: makezTrimmedString(
      "Le format du token peConnect est invalide",
    ),
    expires_in: z.number().min(1, "Ce token est déja expiré"),
  });
