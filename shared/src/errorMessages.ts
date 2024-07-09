import { AgencyId } from "./agency/agency.dto";
import type {
  ConventionId,
  ConventionStatus,
} from "./convention/convention.dto";
import { UserId } from "./inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { Role } from "./role/role.dto";
import { SiretDto } from "./siret/siret";

export const errorMessages = {
  convention: {
    notFound: ({ conventionId }: { conventionId: ConventionId }) =>
      `Aucune convention trouvée avec l'identifiant : ${conventionId}. Êtes-vous sûr d'avoir bien tapé votre identifiant de convention ?`,
    conflict: ({ conventionId }: { conventionId: ConventionId }) =>
      `Une convention avec l'identifiant ${conventionId} existe déjà.`,
    forbiddenStatus: ({ status }: { status: ConventionStatus }) =>
      `Impossible de créer une convention avec le statut "${status}"`,
    badRoleStatusChange: ({
      roles,
      status,
      conventionId,
    }: {
      roles: Role[];
      status: ConventionStatus;
      conventionId: ConventionId;
    }) =>
      `Les rôles "${roles.join(
        ", ",
      )}" ne peuvent pas appliquer le statut "${status}" pour la convention avec l'identifiant ${conventionId}.`,
    badStatusTransition: ({
      currentStatus,
      targetStatus,
    }: { currentStatus: ConventionStatus; targetStatus: ConventionStatus }) =>
      `Impossible de passer du statut de convention "${currentStatus}" à "${targetStatus}".`,
    twoStepsValidationBadStatus: ({
      targetStatus,
      conventionId,
    }: { targetStatus: ConventionStatus; conventionId: ConventionId }) =>
      `Impossible de passer du statut "${targetStatus}" pour la convention "${conventionId}". La convention doit être d'abord approuvée par un conseiller.`,
    noSignatoryHasSigned: ({
      conventionId,
    }: { conventionId: ConventionId }): string =>
      `Aucun des signataires n'a signé la convention avec l'identifiant ${conventionId}.`,
  },
  establishment: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      `Aucune entreprise trouvée avec le siret : ${siret}. Êtes-vous sûr d'avoir bien tapé votre siret ?`,
    conflictError: ({ siret }: { siret: SiretDto }) =>
      `Une entreprise avec le siret ${siret} existe déjà dans notre annuaire.`,
  },
  address: {
    queryToShort: ({ minLength }: { minLength: number }) =>
      `Vous devez taper au moins ${minLength} caractères pour faire une recherche.`,
  },
  agencies: {
    notFound: ({ agencyIds }: { agencyIds: AgencyId[] }) =>
      [
        `Nous n'avons pas trouvé les agences avec les identifiants suivants : ${agencyIds.join(
          ", ",
        )}.`,
        agencyIds.length
          ? `Nous avons seulement trouvé : ${agencyIds.join(", ")}.`
          : "Aucune agence trouvée.",
      ].join(""),
  },
  agency: {
    notFound: ({ agencyId }: { agencyId: AgencyId }) =>
      `Aucune agence trouvée avec l'identifiant : ${agencyId}.`,
  },
  user: {
    noJwtProvided: () => "Aucun jeton d'authentification (JWT) fourni.",
    notFound: ({ userId }: { userId: UserId }) =>
      `Aucun utilisateur trouvé avec l'identifiant : ${userId}.`,
    forbidden: ({ userId }: { userId: UserId }) =>
      `L'utilisateur qui a l'identifiant "${userId}" n'a pas le droit d'accéder à cette ressource.`,
    alreadyHaveAgencyRights: ({ userId }: { userId: UserId }) =>
      `L'utilisateur qui a l'identifiant "${userId}" a déjà les droits pour cette agence.`,
    noRightsOnAgency: ({
      agencyId,
      userId,
    }: { userId: UserId; agencyId: AgencyId }) =>
      `L'utilisateur qui a l'identifiant "${userId}" n'a pas de droits sur l'agence "${agencyId}".`,
  },
  location: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      `Aucun emplacement trouvé pour l'entreprise avec le siret : ${siret}`,
  },
};
