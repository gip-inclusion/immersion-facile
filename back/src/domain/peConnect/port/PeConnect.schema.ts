import { makezTrimmedString } from "shared";
import { z } from "zod";
import { ConventionPoleEmploiUserAdvisorDto } from "../dto/PeConnect.dto";
import { conventionPoleEmploiAdvisors } from "../dto/PeConnectAdvisor.dto";
import { ConventionAndPeExternalIds } from "./ConventionPoleEmploiAdvisorRepository";

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
        type: z.enum(conventionPoleEmploiAdvisors),
      })
      .optional(),
    peExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
  });

export const conventionPoleEmploiUserAdvisorIdsSchema: z.Schema<ConventionAndPeExternalIds> =
  z.object({
    peExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
  });
