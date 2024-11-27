import { LocationId } from "../address/address.dto";
import { AgencyId } from "../agency/agency.dto";
import {
  ApiConsumerRightName,
  ApiConsumerSubscriptionId,
} from "../apiConsumer/ApiConsumer";
import type {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ReminderKind,
} from "../convention/convention.dto";
import { DiscussionId } from "../discussion/discussion.dto";
import { Email } from "../email/email.dto";
import { PeExternalId } from "../federatedIdentities/federatedIdentity.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { GroupSlug } from "../group/group.dto";
import {
  IdentityProvider,
  OAuthState,
} from "../inclusionConnect/inclusionConnect.dto";
import {
  AgencyRole,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import {
  NotificationId,
  NotificationKind,
} from "../notifications/notifications.dto";
import { Role } from "../role/role.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { ShortLinkId } from "../shortLink/shortLink.dto";
import { SiretDto } from "../siret/siret";
import { toDisplayedDate } from "../utils/date";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestApiError,
  UnauthorizedError,
  UnavailableApiError,
} from "./httpErrors";

export const errors = {
  inclusionConnect: {
    missingOAuth: ({
      state,
      identityProvider,
    }: { state?: OAuthState; identityProvider?: IdentityProvider }) =>
      state && identityProvider
        ? new ForbiddenError(
            `Il n'y a pas d'OAuth en cours avec l'état '${state}' et le provider '${identityProvider}'.`,
          )
        : new ForbiddenError("Il n'y a pas d'OAuth en cours"),
    nonceMismatch: () =>
      new ForbiddenError("Il y a un décalage sur le 'Nonce'."),
    couldNotGetUserInfo: ({ message }: { message: string }) =>
      new BadRequestError(
        `Impossible de récupérer les infos ProConnect : ${message}`,
      ),
  },
  convention: {
    updateBadStatusInParams: ({ id }: { id: ConventionId }) =>
      new ForbiddenError(
        `Convention ${id} with modifications should have status READY_TO_SIGN`,
      ),
    updateBadStatusInRepo: ({ id }: { id: ConventionId }) =>
      new BadRequestError(
        `Convention ${id} cannot be modified as it has status PARTIALLY_SIGNED`,
      ),
    updateForbidden: ({ id }: { id: ConventionId }) =>
      new ForbiddenError(`User is not allowed to update convention ${id}`),
    missingFTAdvisor: ({ ftExternalId }: { ftExternalId: PeExternalId }) =>
      new NotFoundError(
        `Il n'y a pas de conseiller France Travail attaché à l'identifiant OAuth ftExternalId '${ftExternalId}'.`,
      ),
    notValidated: ({ convention }: { convention: ConventionDto }) =>
      new BadRequestError(
        `La convention '${convention.id}' n'est pas validée. Son status est '${convention.status}'.`,
      ),
    notFound: ({ conventionId }: { conventionId: ConventionId }) =>
      new NotFoundError(
        `Aucune convention trouvée avec l'identifiant '${conventionId}'. Êtes-vous sûr d'avoir bien tapé votre identifiant de convention ?`,
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
    forbiddenReminder: ({
      convention,
      kind,
    }: { convention: ConventionDto; kind: ReminderKind }) =>
      new ForbiddenError(
        `Convention with id: '${convention.id}' and status: '${convention.status}' is not supported for reminder ${kind}.`,
      ),
  },
  establishment: {
    badPagination: ({
      page,
      perPage,
      totalPages,
    }: { page: number; totalPages: number; perPage: number }) =>
      new BadRequestError(
        `Le numéro de la page est plus grand que le nombre total de pages (page demandée: ${page} > pages totales: ${totalPages}, avec ${perPage} résultats / page).`,
      ),
    invalidGeoParams: () =>
      new BadRequestError("Les paramètres géographiques ne sont pas valides."),
    outOfMaxLimit: ({ kind, maxLimit }: { kind: string; maxLimit: number }) =>
      new BadRequestError(
        `La requête '${kind}' n'autorise pas une limite de '${maxLimit}'.`,
      ),
    missingAggregate: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `L'établissement avec le siret '${siret}' n'existe pas dans le stockage des établissements.`,
      ),
    pgCreateConflict: ({ siret, error }: { siret: SiretDto; error: Error }) =>
      new ConflictError(
        `Il n'est pas possible de créer l'établissement avec le siret '${siret}'. Erreur: '${error}'.`,
      ),
    noUserRights: ({ siret }: { siret: SiretDto }) =>
      new BadRequestError(
        `L'établissement avec le siret ${siret}, n'a aucun utilisateur.`,
      ),
    missingOrClosed: ({ siret }: { siret: SiretDto }) =>
      new BadRequestError(
        `Ce SIRET (${siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
      ),
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Aucune entreprise trouvée avec le siret : ${siret}. Êtes-vous sûr d'avoir bien tapé votre siret ?`,
      ),
    adminNotFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `Aucun administrateur trouvé pour l'établissement avec le siret : ${siret}.`,
      ),
    siretMismatch: () =>
      new ForbiddenError(
        "Il y a un problème de cohérence de Siret entre les données techniques (JWT et formulaire).",
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
          `Une demande de mise en contact existe déjà pour l'entreprise '${siret}', le code métier '${appellationCode}' et l'email du candidat.`,
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
        `Incohérence sur le mode de mise en contact. '${contactMethods.inParams}' dans les params. '${contactMethods.inRepo}' dans le contact d'entreprise '${siret}'.`,
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
    noLocation: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(`L'établissement '${siret}' n'a pas de localisations.`),
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
    notFound: ({
      missingAgencyIds,
      presentAgencyIds = [],
    }: { missingAgencyIds: AgencyId[]; presentAgencyIds?: AgencyId[] }) =>
      new NotFoundError(
        [
          `Nous n'avons pas trouvé les agences avec les identifiants suivants : ${missingAgencyIds.join(
            ", ",
          )}. `,
          presentAgencyIds.length
            ? `Nous avons seulement trouvé : ${presentAgencyIds.join(", ")}.`
            : "Aucune agence trouvée.",
        ].join(""),
      ),
    refersToMismatch: ({
      agencyWithRefersToId,
      referedAgencyId,
    }: { agencyWithRefersToId: AgencyId; referedAgencyId: AgencyId }) =>
      `Le refersToAgencyId de l'agence '${agencyWithRefersToId}' ne correspond pas avec l'agence '${referedAgencyId}' à laquelle elle est référencée.`,
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
    emailNotFound: ({ agencyId }: { agencyId: AgencyId }) =>
      new NotFoundError(
        `Mail not found for agency with id: ${agencyId} on agency repository.`,
      ),
    userAlreadyExist: () =>
      new BadRequestError(
        "L'utilisateur est déjà rattaché à cette agence. Vous pouvez le modifier depuis la liste des utilisateurs de l'agence.",
      ),
    usersNotFound: ({ agencyId }: { agencyId: AgencyId }) =>
      new NotFoundError(`L'agence ${agencyId} n'a aucun utilisateur rattaché`),
    notEnoughCounsellors: ({ agencyId }: { agencyId: AgencyId }) =>
      new BadRequestError(
        `L'agence ${agencyId} doit avoir au moins un conseiller recevant les emails.`,
      ),
    notEnoughValidators: ({ agencyId }: { agencyId: AgencyId }) =>
      new BadRequestError(
        `L'agence ${agencyId} doit avoir au moins un validateur recevant les emails.`,
      ),
    notRejected: ({ agencyId }: { agencyId: AgencyId }) =>
      new BadRequestError(`L'agence ${agencyId} n'est pas rejetée.`),
    invalidRoleUpdateForOneStepValidationAgency: ({
      agencyId,
    }: { agencyId: AgencyId }) =>
      new BadRequestError(
        `L'agence "${agencyId}" à une seule étape de validation ne peut pas avoir aucun validateur recevant des notifications.`,
      ),

    invalidRoleUpdateForAgencyWithRefersTo: ({
      agencyId,
      role,
    }: { agencyId: AgencyId; role: AgencyRole }) =>
      new BadRequestError(
        `Le role "${role}" n'est pas autorisé pour l'agence "${agencyId}" car cette agence est une structure d'accompagnement.`,
      ),

    invalidValidatorEditionWhenAgencyWithRefersTo: (agencyId: AgencyId) =>
      new BadRequestError(
        `L'ajout, la suppression ou l'édition d'un valideur n'est pas autorisée pour l'agence "${agencyId}" car il s'agit d'une structure d'accompagnement. Cette action est autorisée seulement par l'agence prescriptrice à laquelle elle est rattachée.`,
      ),
  },
  users: {
    notFound: ({ userIds }: { userIds: UserId[] }) =>
      new NotFoundError(
        `Nous n'avons pas trouvé les utilisateurs avec les identifiants suivants : ${userIds.join(
          ", ",
        )}.`,
      ),
  },
  user: {
    unauthorized: () => new UnauthorizedError(),
    noJwtProvided: () =>
      new ForbiddenError("Aucun jeton d'authentification (JWT) fourni."),
    expiredJwt: () =>
      new ForbiddenError("Le jeton d'authentification (JWT) fourni a expiré."),
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
    expectedRightsOnAgency: ({
      agencyId,
      userId,
    }: { userId: UserId; agencyId: AgencyId }) =>
      new BadRequestError(
        `L'utilisateur qui a l'identifiant "${userId}" n'a pas de droits sur l'agence "${agencyId}".`,
      ),
    noRightsOnAgency: ({
      agencyId,
      userId,
    }: { userId: UserId; agencyId: AgencyId }) =>
      new ForbiddenError(
        `L'utilisateur qui a l'identifiant "${userId}" n'a pas de droits sur l'agence "${agencyId}".`,
      ),
    notBackOfficeAdmin: (params?: { userId: UserId }) =>
      new ForbiddenError(
        `L'utilisateur '${params?.userId} 'n'est pas administrateur Immersion Facilitée.`,
      ),
    notConventionSignatory: () =>
      new ForbiddenError(
        "Seul les signataires peuvent signer la convention. Le lien que vous avez utilisé ne vous permet pas de signer la convention.",
      ),
    conflictByEmail: ({ userEmail }: { userEmail: Email }) =>
      new ConflictError(
        `L'utilisateur ayant le mail ${userEmail} existe déjà.`,
      ),
    conflictById: ({ userId }: { userId: UserId }) =>
      new ConflictError(
        `L'utilisateur ayant l'identifiant ${userId} existe déjà.`,
      ),
    conflictByExternalId: ({ externalId }: { externalId: string }) =>
      new ConflictError(
        `L'utilisateur ayant l'externalId ${externalId} existe déjà.`,
      ),
    forbiddenToChangeEmailForUIcUser: () =>
      new ForbiddenError(
        "Il n'est pas possible de modifier un mail d'un utilisateur inclusion connecté.",
      ),
  },
  broadcastFeedback: {
    notFound: ({
      conventionId,
    }: {
      conventionId: ConventionId;
    }) =>
      new NotFoundError(
        `Il n'y a pas d'erreur non géré de transfert de convention pour la convention '${conventionId}'.`,
      ),
    tooManyRequests: (params: {
      lastBroadcastDate: Date;
      formattedWaitingTime: string;
    }) =>
      new TooManyRequestApiError(
        `La convention a été synchronisée le ${toDisplayedDate({
          date: params.lastBroadcastDate,
          withHours: true,
          showGMT: true,
        })}. Merci d'essayer à nouveau dans ${params.formattedWaitingTime}.`,
      ),
  },
  discussion: {
    badSiretFilter: () =>
      new BadRequestError(
        "Le filtre par SIRET est fourni mais il n'y a pas de SIRET dans le filtre.",
      ),
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
      new BadRequestError(`L'email n'a pas le bon format '${email}'.`),
    badRecipientKindFormat: ({ kind }: { kind: string }) =>
      new BadRequestError(`L'email n'a pas le bon type '${kind}'.`),
    hasDiscussionMissingParams: () =>
      new BadRequestError(
        "Aucun critère n'a été fourni pour vérifier l'existence d'une mise en relation.",
      ),
  },
  establishmentGroup: {
    missingBySlug: ({ groupSlug }: { groupSlug: GroupSlug }) =>
      new NotFoundError(`Aucun group avec le terme ${groupSlug} trouvé.`),
  },
  apiConsumer: {
    forbidden: () => new ForbiddenError(),
    notEnoughPrivilege: () =>
      new ForbiddenError(
        "Vous n'avez pas le droit d'accès à cette route. Contactez le support Immersion Facilitée si vous voulez plus de privilèges.",
      ),
    missingRights: ({ rightName }: { rightName: ApiConsumerRightName }) =>
      new ForbiddenError(
        `You do not have the "SUBSCRIPTION" kind associated to the "${rightName}" right.`,
      ),
    missing: ({ id }: { id: ApiConsumerSubscriptionId }) =>
      new NotFoundError(`subscription ${id} not found`),
  },
  inputs: {
    badSchema: ({ flattenErrors }: { flattenErrors: string[] }) =>
      new BadRequestError(
        "Schema validation failed. See issues for details.",
        flattenErrors,
      ),
  },
  siretApi: {
    notFound: ({ siret }: { siret: SiretDto }) =>
      new NotFoundError(
        `L'établissement avec le siret '${siret}' n'est pas trouvé dans l'API SIRET.`,
      ),
    tooManyRequests: ({ serviceName }: { serviceName: string }) =>
      new TooManyRequestApiError(
        `Le service ${serviceName} a subit trop de sollicitation`,
      ),
    unavailable: ({ serviceName }: { serviceName: string }) =>
      new UnavailableApiError(serviceName),
  },
  shortLink: {
    notFound: ({ shortLinkId }: { shortLinkId: ShortLinkId }) =>
      new NotFoundError(`Le lien court '${shortLinkId}' n'existe pas.`),
  },
  notification: {
    notFound: ({ id, kind }: { id: NotificationId; kind: NotificationKind }) =>
      new NotFoundError(
        `La notification avec l'identifiant '${id}' et le type '${kind}' n'existe pas.`,
      ),
    missingRecipient: (params: { notificationId?: NotificationId }) =>
      new BadRequestError(
        `Il n'y a pas de destinataire fourni pour l'email. ${
          params?.notificationId
            ? `Identifiant de la notification : ${params.notificationId}`
            : ""
        }`,
      ),
  },
  dashboard: {
    establishmentConventionForbidden: () =>
      new ForbiddenError(
        "'establishmentRepresentativeConventions' n'est pas disponible pour 'GetDashboardUrl'",
      ),
  },
  delegation: {
    missingLabel: ({ label }: { label: ShortLinkId }) =>
      new BadRequestError(`No value found for label "${label}".`),
    missingEmail: ({ province }: { province: ShortLinkId }) =>
      new BadRequestError(`Province ${province} not found`),
  },
  routeParams: {
    missingJwt: () =>
      new BadRequestError(
        "La page que vous avez atteint n'est n'est pas valide : aucun jeton d'authentification fourni.",
      ),
    malformedJson: ({ paramName }: { paramName: string }) =>
      new BadRequestError(
        `Il semble que le paramètre d'URL '${paramName}' est incorrect : vous n'avez probablement pas copié-collé le lien correctement.`,
      ),
  },
  breadcrumbs: {
    notFound: ({ currentRouteName }: { currentRouteName: string }) =>
      new NotFoundError(
        `Le fil d'arianne n'est pas défini pour cette page ('${currentRouteName}').`,
      ),
  },
};
