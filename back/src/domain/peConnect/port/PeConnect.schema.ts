import { makezTrimmedString } from "shared";
import { z } from "zod";
import {
  conventionPoleEmploiAdvisors,
  ConventionPoleEmploiUserAdvisorDto,
} from "../dto/PeConnect.dto";
import { ConventionAndPeExternalIds } from "./ConventionPoleEmploiAdvisorRepository";

export const conventionPoleEmploiUserAdvisorDtoSchema: z.Schema<ConventionPoleEmploiUserAdvisorDto> =
  z.object({
    userPeExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
    firstName: makezTrimmedString(
      "Le prénom du conseiller ne peut pas être vide",
    ),
    lastName: makezTrimmedString("Le nom du conseiller ne peut pas être vide"),
    email: z.string().email("L'email du conseiller est invalide"),
    type: z.enum(conventionPoleEmploiAdvisors),
  });

export const conventionPoleEmploiUserAdvisorIdsSchema: z.Schema<ConventionAndPeExternalIds> =
  z.object({
    peExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
  });
