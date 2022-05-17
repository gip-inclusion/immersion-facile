import { z } from "zod";
import {
  PeUserAndAdvisors,
  PeConnectAdvisorDTO,
  PeUserAndAdvisor,
  AdvisorTypes,
} from "../port/PeConnectGateway";

const conventionPoleEmploiAdvisorTypes = ["PLACEMENT", "CAPEMPLOI"] as const;

// REVIEW Comment verrouiller la compatibilité des types ?
type ConventionPoleEmploiAdvisorTypes = Omit<AdvisorTypes, "INDEMNISATION">; //= typeof conventionPoleEmploiAdvisorTypes[number];

/*export type PoleEmploiUserAdvisorEntity = {
  id?: string;
  immersionApplicationId?: string;
  userPeExternalId: string;
  firstName: string;
  lastName: string;
  email: string;
  type: ConventionPoleEmploiAdvisorTypes;
};*/

export type PoleEmploiUserAdvisorDTO = {
  userPeExternalId: string;
  firstName: string;
  lastName: string;
  email: string;
  type: ConventionPoleEmploiAdvisorTypes;
};

export type ConventionPoleEmploiUserAdvisorEntityOpen = {
  id: string;
} & PoleEmploiUserAdvisorDTO;

export type ConventionPoleEmploiUserAdvisorEntityClosed = {
  conventionId: string;
} & ConventionPoleEmploiUserAdvisorEntityOpen;

// TODO on peut typer ça ??? s.ZodAny | z.ZodString | z.ZodEffect<any, any, any>
// typer avec { [key: string]: any } cause une erreur sur les schema au z.object(...)
const shape = {
  userPeExternalId: z.string().uuid(),
  firstName: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (s) => s.length > 0,
      "Le prénom du conseiller ne peut pas être vide",
    ),
  lastName: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Le nom du conseiller ne peut pas être vide"),
  email: z.string().email("L'email du conseiller est invalide"),
  type: z.enum(conventionPoleEmploiAdvisorTypes),
};

export const poleEmploiUserAdvisorEntitySchema: z.Schema<PoleEmploiUserAdvisorDTO> =
  z.object(shape);

export const conventionPoleEmploiUserAdvisorEntityOpenSchema: z.Schema<ConventionPoleEmploiUserAdvisorEntityOpen> =
  z
    .object({
      id: z.string().uuid(),
      immersionApplicationId: z.undefined(),
    })
    .merge(z.object(shape));

export const toConventionPoleEmploiAdvisorDTO = ({
  user,
  advisor,
}: PeUserAndAdvisor): PoleEmploiUserAdvisorDTO => ({
  ...advisor,
  userPeExternalId: user.peExternalId,
});

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConventionPoleEmploiAdvisorEntity {
  export const createFromUserAndAdvisors = ({
    user,
    advisors,
  }: PeUserAndAdvisors): PoleEmploiUserAdvisorDTO =>
    toConventionPoleEmploiAdvisorDTO({
      user,
      advisor: choosePreferredAdvisor(advisors),
    });

  // TODO More elegant way to do this ?
  const choosePreferredAdvisor = (
    advisors: PeConnectAdvisorDTO[],
  ): PeConnectAdvisorDTO =>
    advisors.filter((advisor) => advisor.type != "INDEMNISATION")[0];
}
