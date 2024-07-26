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
      new ForbiddenError(
        "Il y a un problème de cohérance de Siret entre les données techniques (JWT et formulaire).",
      ),
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
          `Une demande de mise en contact existe déjà pour l'entreprise '${siret}', le code métier '${appellationCode}' et l'émail du candidat.`,
          `Un minimum de ${minimumNumberOfDaysBetweenSimilarContactRequests} jours entre deux demande de mise en contact sont permises.`,
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
        `Incohérance sur le mode de mise en contact. '${contactMethods.inParams}' dans les params. '${contactMethods.inRepo}' dans le contact d'entreprise '${siret}'.`,
      ),
    offerMissing: ({
      siret,
      appellationCode,
      mode,
    }: {
      siret: SiretDto;
      appellationCode: AppellationCode;
      mode: "not found" | "bad request";
    }) =>
      mode === "bad request"
        ? new BadRequestError(
            `L'entreprise '${siret}' n'a pas d'offre d'immersion avec le code appellation '${appellationCode}'.`,
          )
        : new NotFoundError(
            `L'entreprise '${siret}' n'a pas d'offre d'immersion avec le code appellation '${appellationCode}'.`,
          ),
    missingLocation: ({
      siret,
      locationId,
    }: {
      siret: SiretDto;
      locationId: LocationId;
    }) =>
      new NotFoundError(
        `L'addresse '${locationId}' n'existe pas pour l'entreprise '${siret}'.`,
      ),
    forbiddenUnavailable: ({
      siret,
    }: {
      siret: SiretDto;
    }) =>
      new ForbiddenError(
        `L'entreprise ${siret} n'est pas disponible pour des immersions.`,
      ),
  },
  establishmentLead: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Les informations de lead d'entreprise avec le siret '${siret}' ne sont pas trouvés.`,
      ),
  },
  establishmentMarketing: {
    notFound: ({ siret }: { siret: string }) =>
      new NotFoundError(
        `Les informations de marketing d'entreprise avec le siret '${siret}' ne sont pas trouvés.`,
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
      new ForbiddenError(
        `L'utilisateur '${userId}' n'est pas administrateur Immersion Facilitée.`,
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
      conventionId,
    }: {
      conventionId: ConventionId;
    }) =>
      new NotFoundError(
        `Il n'y a pas d'erreur non géré de transfert de convention pour la convention '${conventionId}'.`,
      ),
  },
  discussion: {
    notFound: ({ discussionId }: { discussionId: DiscussionId }) =>
      new NotFoundError(`La discussion '${discussionId}' n'est pas trouvée.`),
    missingAppellationLabel: ({
      appellationCode,
    }: { appellationCode: AppellationCode }) =>
      new BadRequestError(
        `Pas de label trouvé pour le code appélation métier '${appellationCode}'.`,
      ),
    rejectForbidden: ({
      discussionId,
      userId,
    }: { discussionId: DiscussionId; userId: UserId }) =>
      new ForbiddenError(
        `L'utilisateur '${userId}' n'a pas le droit de rejeter la discussion '${discussionId}'.`,
      ),
    alreadyRejected: ({ discussionId }: { discussionId: DiscussionId }) =>
      new BadRequestError(`La discussion '${discussionId}' est déjà rejetée.`),
    accessForbidden: ({
      discussionId,
      userId,
    }: { discussionId: DiscussionId; userId: UserId }) =>
      new ForbiddenError(
        `L'utilisateur '${userId}' n'a pas accès à la discussion '${discussionId}'.`,
      ),
    badEmailFormat: ({ email }: { email: Email }) =>
      new BadRequestError(`L'émail n'a pas le bon format '${email}'.`),
    badRecipientKindFormat: ({ kind }: { kind: string }) =>
      new BadRequestError(`L'émail n'a pas le bon type '${kind}'.`),
    hasDiscussionMissingParams: () =>
      new BadRequestError(
        "Aucun critère n'a été fourni pour vérifier l'existence d'une mise en relation.",
      ),
  },
  establishmentGroup: {
    missingBySlug: ({ groupSlug }: { groupSlug: GroupSlug }) =>
      new NotFoundError(`Aucun group avec le terme ${groupSlug} trouvé.`),
  },
};
