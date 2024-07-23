import { LocationId } from "../address/address.dto";
import { AgencyId } from "../agency/agency.dto";
import type {
  ConventionId,
  ConventionStatus,
} from "../convention/convention.dto";
import { DiscussionId } from "../discussion/discussion.dto";
import { Email } from "../email/email.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { GroupSlug } from "../group/group.dto";
import { UserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { Role } from "../role/role.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
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
    roleHasNoMagicLink: ({ role }: { role: Role }) =>
      new BadRequestError(`Le rôle "${role}" n'a pas de liens magiques.`),
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
    missingActor: ({
      conventionId,
      role,
    }: { conventionId: ConventionId; role: Role }) =>
      new BadRequestError(`There is no ${role} on convention ${conventionId}.`),
    unsupportedRoleRenewMagicLink: ({ role }: { role: Role }) =>
      new BadRequestError(
        `Le rôle ${role} n'est pas supporté pour le renouvellement de lien magique.`,
      ),
  },
  establishment: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Aucune entreprise trouvée avec le siret : ${siret}. Êtes-vous sûr d'avoir bien tapé votre siret ?`,
      ),
    siretMismatch: () =>
      new ForbiddenError("Siret mismatch in JWT payload and form"),
    conflictError: ({ siret }: { siret: SiretDto }) =>
      new ConflictError(
        `Une entreprise avec le siret ${siret} existe déjà dans notre annuaire.`,
      ),
    contactRequestConflict: ({
      siret,
      appellationCode,
      minimumNumberOfDaysBetweenSimilarContactRequests,
    }: {
      siret: SiretDto;
      appellationCode: AppellationCode;
      minimumNumberOfDaysBetweenSimilarContactRequests: number;
    }) =>
      new ConflictError(
        [
          `A contact request already exists for siret ${siret} and appellation ${appellationCode}, and this potential beneficiary email.`,
          `Minimum ${minimumNumberOfDaysBetweenSimilarContactRequests} days between two similar contact requests.`,
        ].join("\n"),
      ),
    contactRequestContactModeMismatch: ({
      siret,
      contactMethods,
    }: {
      siret: SiretDto;
      contactMethods: { inParams: ContactMethod; inRepo: ContactMethod };
    }) =>
      new BadRequestError(
        `Contact mode mismatch: ${contactMethods.inParams} in params. In contact (fetched with siret ${siret}) : ${contactMethods.inRepo}`,
      ),
    immersionOfferNotFound: ({
      siret,
      appellationCode,
    }: {
      siret: SiretDto;
      appellationCode: AppellationCode;
    }) =>
      new NotFoundError(
        `Establishment with siret '${siret}' doesn't have an immersion offer with appellation code '${appellationCode}'.`,
      ),
    immersionOfferBadRequest: ({
      siret,
      appellationCode,
    }: {
      siret: SiretDto;
      appellationCode: AppellationCode;
    }) =>
      new BadRequestError(
        `Establishment with siret '${siret}' doesn't have an immersion offer with appellation code '${appellationCode}'.`,
      ),
    missingLocation: ({
      siret,
      locationId,
    }: {
      siret: SiretDto;
      locationId: LocationId;
    }) =>
      new NotFoundError(
        `Address with id ${locationId} not found for establishment with siret ${siret}`,
      ),
    forbiddenUnavailable: ({
      siret,
    }: {
      siret: SiretDto;
    }) => new ForbiddenError(`The establishment ${siret} is not available.`),
  },
  establishmentLead: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(`No establishment lead were found with siret ${siret}`),
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
    invalidSiret: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Le SIRET que vous avez saisi (${siret}) n'est pas valide et votre organisme n'a pas été enregistré. Merci de corriger le SIRET et de soumettre à nouveau le formulaire.`,
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
    notBackOfficeAdmin: ({ userId }: { userId: UserId }) =>
      new ForbiddenError(`User '${userId}' is not a backoffice admin.`),
  },
  // location: {
  //   notFound: ({ siret }: { siret: SiretDto }) =>
  //     new NotFoundError(
  //       `Aucun emplacement trouvé pour l'entreprise avec le siret : ${siret}`,
  //     ),
  // },
  broadcastFeedback: {
    notFound: ({
      conventionId,
    }: {
      conventionId: ConventionId;
    }) =>
      new NotFoundError(
        `There's no unhandled errors for convention id '${conventionId}'.`,
      ),
  },
  establishmentMarketing: {
    notFound: ({ siret }: { siret: string }) =>
      new NotFoundError(
        `Establishment marketing contact with siret '${siret}' not found.`,
      ),
  },
  discussion: {
    notFound: ({ discussionId }: { discussionId: DiscussionId }) =>
      new NotFoundError(`No discussion with id '${discussionId}' not found.`),
    missingAppellationLabel: ({
      appellationCode,
    }: { appellationCode: AppellationCode }) =>
      new BadRequestError(
        `No appellationLabel found for appellationCode: ${appellationCode}`,
      ),
    rejectForbidden: ({ discussionId }: { discussionId: DiscussionId }) =>
      new ForbiddenError(
        `User is not allowed to reject discussion ${discussionId}`,
      ),
    alreadyRejected: ({ discussionId }: { discussionId: DiscussionId }) =>
      new BadRequestError(
        `Can't reject discussion ${discussionId} because it is already rejected`,
      ),
    accessForbidden: ({
      discussionId,
      userId,
    }: { discussionId: DiscussionId; userId: UserId }) =>
      new ForbiddenError(
        `User '${userId}' is not allowed to access discussion with id ${discussionId}`,
      ),
    badEmailFormat: ({ email }: { email: Email }) =>
      new BadRequestError(
        `Email does not have the right format email to : ${email}`,
      ),
    badRecipientKindFormat: ({ kind }: { kind: string }) =>
      new BadRequestError(
        `Email does not have the right format kind : ${kind}`,
      ),
  },
  establishmentGroup: {
    missingBySlug: ({ groupSlug }: { groupSlug: GroupSlug }) =>
      new NotFoundError(`Group with slug ${groupSlug} not found`),
  },
};
