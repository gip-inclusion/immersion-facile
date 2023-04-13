import { z } from "zod";

import { makezTrimmedString } from "shared";

import { ExternalAccessToken } from "../../../adapters/secondary/PeConnectGateway/peConnectApi.dto";

export const externalAccessTokenSchema: z.Schema<ExternalAccessToken> =
  z.object({
    access_token: makezTrimmedString(
      "Le format du token peConnect est invalide",
    ),
    expires_in: z.number().min(1, "Ce token est déja expiré"),
  });
