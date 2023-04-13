import { z } from "zod";
import { makezTrimmedString, zUuidLike } from "shared";
import { ConventionPoleEmploiUserAdvisorDto } from "../dto/PeConnect.dto";
import { immersionPoleEmploiAdvisors } from "../dto/PeConnectAdvisor.dto";

export const conventionPoleEmploiUserAdvisorDtoSchema: z.Schema<ConventionPoleEmploiUserAdvisorDto> =
  z.object({
    advisor: z
      .object({
        firstName: makezTrimmedString(
          "Le prénom du conseiller ne peut pas être vide",
        ),
        lastName: makezTrimmedString(
          "Le nom du conseiller ne peut pas être vide",
        ),
        email: z.string().email("L'email du conseiller est invalide"),
        type: z.enum(immersionPoleEmploiAdvisors),
      })
      .optional(),
    peExternalId: zUuidLike,
    conventionId: z.string().uuid(),
  });
