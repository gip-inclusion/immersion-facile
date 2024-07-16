import { AgencyId } from "../agency/agency.dto";
import type {
  ConventionId,
  ConventionStatus,
} from "../convention/convention.dto";
import { UserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { Role } from "../role/role.dto";
import { SiretDto } from "../siret/siret";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./httpErrors";

export const errors = {
  convention: {
    notFound: ({ conventionId }: { conventionId: ConventionId }) =>
      new NotFoundError(
        `Aucune convention trouvée avec l'identifiant : ${conventionId}. Êtes-vous sûr d'avoir bien tapé votre identifiant de convention ?`,
      ),
    conflict: ({ conventionId }: { conventionId: ConventionId }) =>
      new ConflictError(
        `Une convention avec l'identifiant ${conventionId} existe déjà.`,
      ),
    forbiddenStatus: ({ status }: { status: ConventionStatus }) =>
      new ForbiddenError(
        `Impossible de créer une convention avec le statut "${status}"`,
      ),
    badRoleStatusChange: ({
      roles,
      status,
      conventionId,
    }: {
      roles: Role[];
      status: ConventionStatus;
      conventionId: ConventionId;
    }) =>
      new ForbiddenError(
        `Les rôles "${roles.join(
          ", ",
        )}" ne peuvent pas appliquer le statut "${status}" pour la convention avec l'identifiant ${conventionId}.`,
      ),
    badStatusTransition: ({
      currentStatus,
      targetStatus,
    }: { currentStatus: ConventionStatus; targetStatus: ConventionStatus }) =>
      new BadRequestError(
        `Impossible de passer du statut de convention "${currentStatus}" à "${targetStatus}".`,
      ),
    twoStepsValidationBadStatus: ({
      targetStatus,
      conventionId,
    }: { targetStatus: ConventionStatus; conventionId: ConventionId }) =>
      new ForbiddenError(
        `Impossible de passer du statut "${targetStatus}" pour la convention "${conventionId}". La convention doit être d'abord approuvée par un conseiller.`,
      ),
    noSignatoryHasSigned: ({ conventionId }: { conventionId: ConventionId }) =>
      new BadRequestError(
        `Aucun des signataires n'a signé la convention avec l'identifiant ${conventionId}.`,
      ),
  },
  establishment: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Aucune entreprise trouvée avec le siret : ${siret}. Êtes-vous sûr d'avoir bien tapé votre siret ?`,
      ),
    conflictError: ({ siret }: { siret: SiretDto }) =>
      new ConflictError(
        `Une entreprise avec le siret ${siret} existe déjà dans notre annuaire.`,
      ),
  },
  address: {
    queryToShort: ({ minLength }: { minLength: number }) =>
      new BadRequestError(
        `Vous devez taper au moins ${minLength} caractères pour faire une recherche.`,
      ),
  },
  agencies: {
    notFound: ({ agencyIds }: { agencyIds: AgencyId[] }) =>
      new NotFoundError(
        [
          `Nous n'avons pas trouvé les agences avec les identifiants suivants : ${agencyIds.join(
            ", ",
          )}.`,
          agencyIds.length
            ? `Nous avons seulement trouvé : ${agencyIds.join(", ")}.`
            : "Aucune agence trouvée.",
        ].join(""),
      ),
  },
  agency: {
    notFound: ({ agencyId }: { agencyId: AgencyId }) =>
      new NotFoundError(
        `Aucune agence trouvée avec l'identifiant : ${agencyId}.`,
      ),
  },
  user: {
    unauthorized: () => new UnauthorizedError(),
    noJwtProvided: () =>
      new ForbiddenError("Aucun jeton d'authentification (JWT) fourni."),
    notFound: ({ userId }: { userId: UserId }) =>
      new NotFoundError(
        `Aucun utilisateur trouvé avec l'identifiant : ${userId}.`,
      ),
    forbidden: ({ userId }: { userId: UserId }) =>
      new ForbiddenError(
        `L'utilisateur qui a l'identifiant "${userId}" n'a pas le droit d'accéder à cette ressource.`,
      ),
    alreadyHaveAgencyRights: ({ userId }: { userId: UserId }) =>
      new BadRequestError(
        `L'utilisateur qui a l'identifiant "${userId}" a déjà les droits pour cette agence.`,
      ),
    noRightsOnAgency: ({
      agencyId,
      userId,
    }: { userId: UserId; agencyId: AgencyId }) =>
      new ForbiddenError(
        `L'utilisateur qui a l'identifiant "${userId}" n'a pas de droits sur l'agence "${agencyId}".`,
      ),
  },
  // location: {
  //   notFound: ({ siret }: { siret: SiretDto }) =>
  //     new NotFoundError(
  //       `Aucun emplacement trouvé pour l'entreprise avec le siret : ${siret}`,
  //     ),
  // },
  broadcastFeedback: {
    notFound: ({
      serviceName,
      conventionId,
    }: {
      serviceName: string;
      conventionId: ConventionId;
    }) =>
      new NotFoundError(
        `There's no ${serviceName} unhandled errors for convention id '${conventionId}'.`,
      ),
  },
};
