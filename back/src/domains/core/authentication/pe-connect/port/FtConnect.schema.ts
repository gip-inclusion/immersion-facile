import { makezTrimmedString, zUuidLike } from "shared";
import { z } from "zod";
import { ConventionFtUserAdvisorDto } from "../dto/FtConnect.dto";
import { immersionFranceTravailAdvisors } from "../dto/FtConnectAdvisor.dto";

export const conventionFranceTravailUserAdvisorDtoSchema: z.Schema<ConventionFtUserAdvisorDto> =
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
        type: z.enum(immersionFranceTravailAdvisors),
      })
      .optional(),
    peExternalId: zUuidLike,
    conventionId: z.string().uuid(),
  });
