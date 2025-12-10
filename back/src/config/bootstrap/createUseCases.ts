import { keys } from "ramda";
import {
  type ConnectedUser,
  type ConventionId,
  findSimilarConventionsParamsSchema,
  NotFoundError,
  siretSchema,
} from "shared";
import z from "zod";
import { makeAddAgenciesAndUsers } from "../../domains/agency/use-cases/AddAgenciesAndUsers";
import { makeAddAgency } from "../../domains/agency/use-cases/AddAgency";
import { makeGetAgencyById } from "../../domains/agency/use-cases/GetAgencyById";
import { makeListAgencyOptionsByFilter } from "../../domains/agency/use-cases/ListAgenciesByFilter";
import { makePrivateListAgencies } from "../../domains/agency/use-cases/PrivateListAgencies";
import { makeRegisterAgencyToConnectedUser } from "../../domains/agency/use-cases/RegisterAgencyToConnectedUser";
import { makeUpdateAgency } from "../../domains/agency/use-cases/UpdateAgency";
import { makeUpdateAgencyReferringToUpdatedAgency } from "../../domains/agency/use-cases/UpdateAgencyReferringToUpdatedAgency";
import { makeUpdateAgencyStatus } from "../../domains/agency/use-cases/UpdateAgencyStatus";
import { throwIfNotAdmin } from "../../domains/connected-users/helpers/authorization.helper";
import { makeCreateUserForAgency } from "../../domains/connected-users/use-cases/CreateUserForAgency";
import { makeGetConnectedUser } from "../../domains/connected-users/use-cases/GetConnectedUser";
import { makeGetConnectedUsers } from "../../domains/connected-users/use-cases/GetConnectedUsers";
import { makeGetUsers } from "../../domains/connected-users/use-cases/GetUsers";
import { makeLinkFranceTravailUsersToTheirAgencies } from "../../domains/connected-users/use-cases/LinkFranceTravailUsersToTheirAgencies";
import { makeRejectUserForAgency } from "../../domains/connected-users/use-cases/RejectUserForAgency";
import { makeRemoveUserFromAgency } from "../../domains/connected-users/use-cases/RemoveUserFromAgency";
import { makeUpdateUserForAgency } from "../../domains/connected-users/use-cases/UpdateUserForAgency";
import { AddConvention } from "../../domains/convention/use-cases/AddConvention";
import { AddValidatedConventionNps } from "../../domains/convention/use-cases/AddValidatedConventionNps";
import { makeBroadcastConventionAgain } from "../../domains/convention/use-cases/broadcast/BroadcastConventionAgain";
import { makeBroadcastToFranceTravailOnConventionUpdates } from "../../domains/convention/use-cases/broadcast/BroadcastToFranceTravailOnConventionUpdates";
import { makeBroadcastToFranceTravailOnConventionUpdatesLegacy } from "../../domains/convention/use-cases/broadcast/BroadcastToFranceTravailOnConventionUpdatesLegacy";
import { makeBroadcastToFranceTravailOrchestrator } from "../../domains/convention/use-cases/broadcast/BroadcastToFranceTravailOrchestrator";
import { makeGetConventionsWithErroredBroadcastFeedback } from "../../domains/convention/use-cases/broadcast/GetConventionsWithErroredBroadcastFeedback";
import { makeCreateAssessment } from "../../domains/convention/use-cases/CreateAssessment";
import { makeEditConventionCounsellorName } from "../../domains/convention/use-cases/EditConventionCounsellorName";
import { GetAgencyPublicInfoById } from "../../domains/convention/use-cases/GetAgencyPublicInfoById";
import { makeGetApiConsumersByConvention } from "../../domains/convention/use-cases/GetApiConsumersByConvention";
import { makeGetAssessmentByConventionId } from "../../domains/convention/use-cases/GetAssessmentByConventionId";
import { GetConvention } from "../../domains/convention/use-cases/GetConvention";
import { GetConventionForApiConsumer } from "../../domains/convention/use-cases/GetConventionForApiConsumer";
import { makeGetConventionsForAgencyUser } from "../../domains/convention/use-cases/GetConventionsForAgencyUser";
import { GetConventionsForApiConsumer } from "../../domains/convention/use-cases/GetConventionsForApiConsumer";
import { makeGetLastBroadcastFeedback } from "../../domains/convention/use-cases/GetLastBroadcastFeedback";
import { DeliverRenewedMagicLink } from "../../domains/convention/use-cases/notifications/DeliverRenewedMagicLink";
import { NotifyAgencyDelegationContact } from "../../domains/convention/use-cases/notifications/NotifyAgencyDelegationContact";
import { NotifyAgencyThatAssessmentIsCreated } from "../../domains/convention/use-cases/notifications/NotifyAgencyThatAssessmentIsCreated";
import { NotifyAllActorsOfFinalConventionValidation } from "../../domains/convention/use-cases/notifications/NotifyAllActorsOfFinalConventionValidation";
import { NotifyAllActorsThatConventionIsCancelled } from "../../domains/convention/use-cases/notifications/NotifyAllActorsThatConventionIsCancelled";
import { NotifyAllActorsThatConventionIsDeprecated } from "../../domains/convention/use-cases/notifications/NotifyAllActorsThatConventionIsDeprecated";
import { NotifyAllActorsThatConventionIsRejected } from "../../domains/convention/use-cases/notifications/NotifyAllActorsThatConventionIsRejected";
import { makeNotifyAllActorsThatConventionTransferred } from "../../domains/convention/use-cases/notifications/NotifyAllActorsThatConventionTransferred";
import { makeNotifyBeneficiaryThatAssessmentIsCreated } from "../../domains/convention/use-cases/notifications/NotifyBeneficiaryThatAssessmentIsCreated";
import { NotifyConventionReminder } from "../../domains/convention/use-cases/notifications/NotifyConventionReminder";
import { makeNotifyEstablishmentThatAssessmentWasCreated } from "../../domains/convention/use-cases/notifications/NotifyEstablishmentThatAssessmentWasCreated";
import { NotifyLastSigneeThatConventionHasBeenSigned } from "../../domains/convention/use-cases/notifications/NotifyLastSigneeThatConventionHasBeenSigned";
import { NotifyNewConventionNeedsReview } from "../../domains/convention/use-cases/notifications/NotifyNewConventionNeedsReview";
import { NotifySignatoriesThatConventionSubmittedNeedsSignature } from "../../domains/convention/use-cases/notifications/NotifySignatoriesThatConventionSubmittedNeedsSignature";
import { NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification } from "../../domains/convention/use-cases/notifications/NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification";
import { NotifyToAgencyConventionSubmitted } from "../../domains/convention/use-cases/notifications/NotifyToAgencyConventionSubmitted";
import { NotifyUserAgencyRightChanged } from "../../domains/convention/use-cases/notifications/NotifyUserAgencyRightChanged";
import { NotifyUserAgencyRightRejected } from "../../domains/convention/use-cases/notifications/NotifyUserAgencyRightRejected";
import { MarkPartnersErroredConventionAsHandled } from "../../domains/convention/use-cases/partners-errored-convention/MarkPartnersErroredConventionAsHandled";
import { RenewConvention } from "../../domains/convention/use-cases/RenewConvention";
import { RenewConventionMagicLink } from "../../domains/convention/use-cases/RenewConventionMagicLink";
import { makeSendAssessmentLink } from "../../domains/convention/use-cases/SendAssessmentLink";
import { SendEmailsWhenAgencyIsActivated } from "../../domains/convention/use-cases/SendEmailsWhenAgencyIsActivated";
import { SendEmailWhenAgencyIsRejected } from "../../domains/convention/use-cases/SendEmailWhenAgencyIsRejected";
import { SendEmailWhenNewAgencyOfTypeOtherAdded } from "../../domains/convention/use-cases/SendEmailWhenNewAgencyOfTypeOtherAdded";
import { makeSendSignatureLink } from "../../domains/convention/use-cases/SendSignatureLink";
import { ShareConventionLinkByEmail } from "../../domains/convention/use-cases/ShareConventionLinkByEmail";
import { SignConvention } from "../../domains/convention/use-cases/SignConvention";
import { makeTransferConventionToAgency } from "../../domains/convention/use-cases/TransferConventionToAgency";
import { UpdateConvention } from "../../domains/convention/use-cases/UpdateConvention";
import { UpdateConventionStatus } from "../../domains/convention/use-cases/UpdateConventionStatus";
import { LookupLocation } from "../../domains/core/address/use-cases/LookupLocation";
import { LookupStreetAddress } from "../../domains/core/address/use-cases/LookupStreetAddress";
import { BroadcastToPartnersOnConventionUpdates } from "../../domains/core/api-consumer/use-cases/BroadcastToPartnersOnConventionUpdates";
import { DeleteSubscription } from "../../domains/core/api-consumer/use-cases/DeleteSubscription";
import { makeListActiveSubscriptions } from "../../domains/core/api-consumer/use-cases/ListActiveSubscriptions";
import { SaveApiConsumer } from "../../domains/core/api-consumer/use-cases/SaveApiConsumer";
import { SubscribeToWebhook } from "../../domains/core/api-consumer/use-cases/SubscribeToWebhook";
import { AfterOAuthSuccess } from "../../domains/core/authentication/connected-user/use-cases/AfterOAuthSuccess";
import { makeGetOAuthLogoutUrl } from "../../domains/core/authentication/connected-user/use-cases/GetOAuthLogoutUrl";
import { makeInitiateLoginByEmail } from "../../domains/core/authentication/connected-user/use-cases/InitiateLoginByEmail";
import { InitiateLoginByOAuth } from "../../domains/core/authentication/connected-user/use-cases/InitiateLoginByOAuth";
import { BindConventionToFederatedIdentity } from "../../domains/core/authentication/ft-connect/use-cases/BindConventionToFederatedIdentity";
import { LinkFranceTravailAdvisorAndRedirectToConvention } from "../../domains/core/authentication/ft-connect/use-cases/LinkFranceTravailAdvisorAndRedirectToConvention";
import { NotifyFranceTravailUserAdvisorOnConventionFullySigned } from "../../domains/core/authentication/ft-connect/use-cases/NotifyFranceTravailUserAdvisorOnConventionFullySigned";
import type { DashboardGateway } from "../../domains/core/dashboard/port/DashboardGateway";
import { GetDashboardUrl } from "../../domains/core/dashboard/useCases/GetDashboardUrl";
import { ValidateEmail } from "../../domains/core/email-validation/use-cases/ValidateEmail";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { SetFeatureFlag } from "../../domains/core/feature-flags/use-cases/SetFeatureFlag";
import { UploadFile } from "../../domains/core/file-storage/useCases/UploadFile";
import type {
  GenerateApiConsumerJwt,
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
  GenerateEmailAuthCodeJwt,
  VerifyJwtFn,
} from "../../domains/core/jwt";
import { makeGetNafSuggestions } from "../../domains/core/naf/use-cases/GetNafSuggestions";
import {
  makeSaveNotificationAndRelatedEvent,
  makeSaveNotificationsBatchAndRelatedEvent,
} from "../../domains/core/notifications/helpers/Notification";
import { SendNotification } from "../../domains/core/notifications/useCases/SendNotification";
import { SendNotificationInBatch } from "../../domains/core/notifications/useCases/SendNotificationInBatch";
import { HtmlToPdf } from "../../domains/core/pdf-generation/use-cases/HtmlToPdf";
import { AppellationSearch } from "../../domains/core/rome/use-cases/AppellationSearch";
import { RomeSearch } from "../../domains/core/rome/use-cases/RomeSearch";
import { GetSiret } from "../../domains/core/sirene/use-cases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../domains/core/sirene/use-cases/GetSiretIfNotAlreadySaved";
import { makeGetEstablishmentStats } from "../../domains/core/statistics/use-cases/GetEstablishmentStats";
import { makeSendSupportTicketToCrisp } from "../../domains/core/support/use-cases/SendSupportTicketToCrisp";
import type { TimeGateway } from "../../domains/core/time-gateway/ports/TimeGateway";
import type { TransactionalUseCase, UseCase } from "../../domains/core/UseCase";
import type { OutOfTransactionQueries } from "../../domains/core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UseCaseIdentityPayload } from "../../domains/core/useCase.helpers";
import { useCaseBuilder } from "../../domains/core/useCaseBuilder";
import type { UuidGenerator } from "../../domains/core/uuid-generator/ports/UuidGenerator";
import { AddEstablishmentLead } from "../../domains/establishment/use-cases/AddEstablishmentLead";
import { makeAddFormEstablishmentBatch } from "../../domains/establishment/use-cases/AddFormEstablismentsBatch";
import { ContactEstablishment } from "../../domains/establishment/use-cases/ContactEstablishment";
import { makeContactRequestReminder } from "../../domains/establishment/use-cases/ContactRequestReminder";
import { DeleteEstablishment } from "../../domains/establishment/use-cases/DeleteEstablishment";
import { AddExchangeToDiscussion } from "../../domains/establishment/use-cases/discussions/AddExchangeToDiscussion";
import { GetDiscussionByIdForEstablishment } from "../../domains/establishment/use-cases/discussions/GetDiscussionByIdForEstablishment";
import { makeGetDiscussionsForUser } from "../../domains/establishment/use-cases/discussions/GetDiscussionsForUser";
import { makeMarkDiscussionDeprecatedAndNotify } from "../../domains/establishment/use-cases/discussions/MarkDiscussionDeprecatedAndNotify";
import { makeMarkDiscussionLinkedToConvention } from "../../domains/establishment/use-cases/discussions/MarkDiscussionLinkedToConvention";
import { makeNotifyBeneficiaryToFollowUpContactRequest } from "../../domains/establishment/use-cases/discussions/NotifyBeneficiaryToFollowUpContactRequest";
import { SendExchangeToRecipient } from "../../domains/establishment/use-cases/discussions/SendExchangeToRecipient";
import { makeUpdateDiscussionStatus } from "../../domains/establishment/use-cases/discussions/UpdateDiscussionStatus";
import { makeWarnSenderThatMessageCouldNotBeDelivered } from "../../domains/establishment/use-cases/discussions/WarnSenderThatMessageCouldNotBeDelivered";
import { makeGetEstablishmentNameAndAdmins } from "../../domains/establishment/use-cases/GetEstablishmentNameAndAdmins";
import { makeGetExternalOffers } from "../../domains/establishment/use-cases/GetExternalOffers";
import { makeGetExternalSearchResult } from "../../domains/establishment/use-cases/GetExternalSearchResult";
import { GetOffersByGroupSlug } from "../../domains/establishment/use-cases/GetGroupBySlug";
import { makeGetOffers } from "../../domains/establishment/use-cases/GetOffers";
import { GetSearchResultBySearchQuery } from "../../domains/establishment/use-cases/GetSearchResultBySearchQuery";
import { InsertEstablishmentAggregateFromForm } from "../../domains/establishment/use-cases/InsertEstablishmentAggregateFromFormEstablishement";
import { LegacyContactEstablishment } from "../../domains/establishment/use-cases/LegacyContactEstablishment";
import { LegacySearchImmersion } from "../../domains/establishment/use-cases/LegacySearchImmersion";
import { MarkEstablishmentLeadAsRegistrationAccepted } from "../../domains/establishment/use-cases/MarkEstablishmentLeadAsRegistrationAccepted";
import { MarkEstablishmentLeadAsRegistrationRejected } from "../../domains/establishment/use-cases/MarkEstablishmentLeadAsRegistrationRejected";
import { makeNotifyCandidateThatContactRequestHasBeenSent } from "../../domains/establishment/use-cases/notifications/NotifyCandidateThatContactRequestHasBeenSent";
import { NotifyConfirmationEstablishmentCreated } from "../../domains/establishment/use-cases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyContactRequest } from "../../domains/establishment/use-cases/notifications/NotifyContactRequest";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../domains/establishment/use-cases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { RetrieveFormEstablishmentFromAggregates } from "../../domains/establishment/use-cases/RetrieveFormEstablishmentFromAggregates";
import { UpdateEstablishmentAggregateFromForm } from "../../domains/establishment/use-cases/UpdateEstablishmentAggregateFromFormEstablishement";
import { makeUpdateMarketingEstablishmentContactList } from "../../domains/marketing/use-cases/UpdateMarketingEstablishmentContactsList";
import type { AppConfig } from "./appConfig";
import type { Gateways } from "./createGateways";
import { makeGenerateConventionMagicLinkUrl } from "./magicLinkUrl";

type CreateUsecasesParams = {
  config: AppConfig;
  gateways: Gateways;
  deps: {
    uowPerformer: UnitOfWorkPerformer;
    uuidGenerator: UuidGenerator;
    queries: OutOfTransactionQueries;
  };
  jwt: {
    generateConventionJwt: GenerateConventionJwt;
    generateConnectedUserJwt: GenerateConnectedUserJwt;
    generateApiConsumerJwt: GenerateApiConsumerJwt;
    generateEmailAuthCodeJwt: GenerateEmailAuthCodeJwt;
    verifyEmailAuthCodeJwt: VerifyJwtFn<"emailAuthCode">;
  };
};

export const createUseCases = ({
  config,
  deps: { uowPerformer, uuidGenerator, queries },
  gateways,
  jwt: {
    generateApiConsumerJwt,
    generateConnectedUserJwt,
    generateConventionJwt,
    generateEmailAuthCodeJwt,
    verifyEmailAuthCodeJwt,
  },
}: CreateUsecasesParams) => {
  const createNewEvent = makeCreateNewEvent({
    timeGateway: gateways.timeGateway,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    gateways.timeGateway,
    createNewEvent,
  );

  const saveNotificationsBatchAndRelatedEvent =
    makeSaveNotificationsBatchAndRelatedEvent(
      uuidGenerator,
      gateways.timeGateway,
      createNewEvent,
    );

  const insertEstablishmentAggregateFromForm =
    new InsertEstablishmentAggregateFromForm(
      uowPerformer,
      gateways.siret,
      gateways.addressApi,
      uuidGenerator,
      gateways.timeGateway,
      createNewEvent,
    );

  const generateConventionMagicLinkUrl = makeGenerateConventionMagicLinkUrl(
    config,
    generateConventionJwt,
  );

  const addConvention = new AddConvention(
    uowPerformer,
    createNewEvent,
    gateways.siret,
  );

  const broadcastToFranceTravailOnConventionUpdates =
    makeBroadcastToFranceTravailOnConventionUpdates({
      uowPerformer,
      deps: {
        franceTravailGateway: gateways.franceTravailGateway,
        timeGateway: gateways.timeGateway,
        options: { resyncMode: false },
      },
    });

  const broadcastToFranceTravailOnConventionUpdatesLegacy =
    makeBroadcastToFranceTravailOnConventionUpdatesLegacy({
      uowPerformer,
      deps: {
        franceTravailGateway: gateways.franceTravailGateway,
        timeGateway: gateways.timeGateway,
        options: { resyncMode: false },
      },
    });

  return {
    ...instantiatedUseCasesFromClasses({
      addExchangeToDiscussion: new AddExchangeToDiscussion(
        uowPerformer,
        createNewEvent,
        saveNotificationAndRelatedEvent,
        gateways.timeGateway,
      ),
      sendExchangeToRecipient: new SendExchangeToRecipient(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        config.immersionFacileDomain,
        gateways.notification,
      ),
      getDiscussionByIdForEstablishment: new GetDiscussionByIdForEstablishment(
        uowPerformer,
      ),
      sendNotification: new SendNotification(
        uowPerformer,
        gateways.notification,
        gateways.timeGateway,
        createNewEvent,
      ),
      sendNotificationsInBatch: new SendNotificationInBatch(
        uowPerformer,
        gateways.notification,
      ),
      notifyUserAgencyRightChanged: new NotifyUserAgencyRightChanged(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      notifyUserAgencyRightRejected: new NotifyUserAgencyRightRejected(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      initiateLoginByOAuth: new InitiateLoginByOAuth(
        uowPerformer,
        uuidGenerator,
        gateways.oAuthGateway,
      ),
      afterOAuthSuccessRedirection: new AfterOAuthSuccess(
        uowPerformer,
        createNewEvent,
        gateways.oAuthGateway,
        uuidGenerator,
        generateConnectedUserJwt,
        verifyEmailAuthCodeJwt,
        config.immersionFacileBaseUrl,
        gateways.timeGateway,
      ),
      bindConventionToFederatedIdentity: new BindConventionToFederatedIdentity(
        uowPerformer,
        createNewEvent,
      ),
      uploadFile: new UploadFile(gateways.documentGateway, uuidGenerator),
      htmlToPdf: new HtmlToPdf(gateways.pdfGeneratorGateway),

      addValidatedConventionNPS: new AddValidatedConventionNps(uowPerformer),

      // Address
      lookupStreetAddress: new LookupStreetAddress(gateways.addressApi),
      lookupLocation: new LookupLocation(gateways.addressApi),

      // Conventions
      addConvention,
      getConvention: new GetConvention(uowPerformer),
      getConventionForApiConsumer: new GetConventionForApiConsumer(
        uowPerformer,
      ),
      getConventionsForApiConsumer: new GetConventionsForApiConsumer(
        uowPerformer,
      ),
      linkFranceTravailAdvisorAndRedirectToConvention:
        new LinkFranceTravailAdvisorAndRedirectToConvention(
          uowPerformer,
          gateways.ftConnectGateway,
          config.immersionFacileBaseUrl,
        ),

      updateConvention: new UpdateConvention(
        uowPerformer,
        createNewEvent,
        gateways.timeGateway,
      ),
      updateConventionStatus: new UpdateConventionStatus(
        uowPerformer,
        createNewEvent,
        gateways.timeGateway,
      ),
      signConvention: new SignConvention(
        uowPerformer,
        createNewEvent,
        gateways.timeGateway,
      ),
      renewConventionMagicLink: new RenewConventionMagicLink(
        uowPerformer,
        createNewEvent,
        generateConventionMagicLinkUrl,
        config,
        gateways.timeGateway,
        gateways.shortLinkGenerator,
      ),
      renewConvention: new RenewConvention(uowPerformer, addConvention),
      notifyConventionReminder: new NotifyConventionReminder(
        uowPerformer,
        gateways.timeGateway,
        saveNotificationsBatchAndRelatedEvent,
        generateConventionMagicLinkUrl,
        gateways.shortLinkGenerator,
        config,
      ),

      markPartnersErroredConventionAsHandled:
        new MarkPartnersErroredConventionAsHandled(
          uowPerformer,
          createNewEvent,
          gateways.timeGateway,
        ),

      // immersionOffer
      legacySearchImmersion: new LegacySearchImmersion(
        uowPerformer,
        gateways.laBonneBoiteGateway,
        uuidGenerator,
        gateways.timeGateway,
      ),
      getOffersByGroupSlug: new GetOffersByGroupSlug(uowPerformer),
      getSearchResultBySearchQuery: new GetSearchResultBySearchQuery(
        uowPerformer,
      ),

      retrieveFormEstablishmentFromAggregates:
        new RetrieveFormEstablishmentFromAggregates(uowPerformer),
      updateEstablishmentAggregateFromForm:
        new UpdateEstablishmentAggregateFromForm(
          uowPerformer,
          gateways.addressApi,
          uuidGenerator,
          gateways.timeGateway,
          createNewEvent,
          saveNotificationAndRelatedEvent,
          config.immersionFacileBaseUrl,
        ),
      insertEstablishmentAggregateFromForm,
      addEstablishmentLead: new AddEstablishmentLead(
        uowPerformer,
        gateways.timeGateway,
      ),
      markEstablishmentLeadAsRegistrationAccepted:
        new MarkEstablishmentLeadAsRegistrationAccepted(
          uowPerformer,
          gateways.timeGateway,
        ),
      markEstablishmentLeadAsRegistrationRejected:
        new MarkEstablishmentLeadAsRegistrationRejected(
          uowPerformer,
          gateways.timeGateway,
        ),
      deleteEstablishment: new DeleteEstablishment(
        uowPerformer,
        gateways.timeGateway,
        saveNotificationAndRelatedEvent,
        createNewEvent,
      ),
      contactEstablishment: new ContactEstablishment(
        uowPerformer,
        createNewEvent,
        uuidGenerator,
        gateways.timeGateway,
        config.minimumNumberOfDaysBetweenSimilarContactRequests,
        config.immersionFacileBaseUrl,
      ),
      legacyContactEstablishment: new LegacyContactEstablishment(
        uowPerformer,
        createNewEvent,
        uuidGenerator,
        gateways.timeGateway,
        config.minimumNumberOfDaysBetweenSimilarContactRequests,
      ),
      notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm:
        new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
          uowPerformer,
          gateways.passEmploiGateway,
        ),

      // siret
      getSiret: new GetSiret(gateways.siret),
      getSiretIfNotAlreadySaved: new GetSiretIfNotAlreadySaved(
        uowPerformer,
        gateways.siret,
      ),

      // romes
      appellationSearch: new AppellationSearch(
        uowPerformer,
        gateways.appellationsGateway,
      ),
      romeSearch: new RomeSearch(uowPerformer),

      // email validation
      validateEmail: new ValidateEmail(gateways.emailValidationGateway),

      // agencies
      getAgencyPublicInfoById: new GetAgencyPublicInfoById(uowPerformer),
      sendEmailsWhenAgencyIsActivated: new SendEmailsWhenAgencyIsActivated(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      sendEmailWhenNewAgencyOfTypeOtherAdded:
        new SendEmailWhenNewAgencyOfTypeOtherAdded(
          uowPerformer,
          saveNotificationAndRelatedEvent,
        ),
      sendEmailWhenAgencyIsRejected: new SendEmailWhenAgencyIsRejected(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      // METABASE
      ...dashboardUseCases(gateways.dashboardGateway, gateways.timeGateway),
      // notifications
      notifySignatoriesThatConventionSubmittedNeedsSignature:
        new NotifySignatoriesThatConventionSubmittedNeedsSignature(
          uowPerformer,
          gateways.timeGateway,
          gateways.shortLinkGenerator,
          generateConventionMagicLinkUrl,
          config,
          saveNotificationAndRelatedEvent,
        ),
      notifySignatoriesThatConventionSubmittedNeedsSignatureAfterNotification:
        new NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification(
          uowPerformer,
          gateways.timeGateway,
          gateways.shortLinkGenerator,
          config,
          saveNotificationAndRelatedEvent,
          generateConventionMagicLinkUrl,
        ),
      notifyLastSigneeThatConventionHasBeenSigned:
        new NotifyLastSigneeThatConventionHasBeenSigned(
          uowPerformer,
          saveNotificationAndRelatedEvent,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
        ),
      notifyAllActorsOfFinalConventionValidation:
        new NotifyAllActorsOfFinalConventionValidation(
          uowPerformer,
          saveNotificationAndRelatedEvent,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
          gateways.shortLinkGenerator,
          config,
        ),
      notifyNewConventionNeedsReview: new NotifyNewConventionNeedsReview(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        config,
      ),
      notifyToAgencyConventionSubmitted: new NotifyToAgencyConventionSubmitted(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        config,
      ),
      notifyAllActorsThatConventionIsRejected:
        new NotifyAllActorsThatConventionIsRejected(
          uowPerformer,
          saveNotificationAndRelatedEvent,
        ),
      notifyAllActorsThatConventionIsCancelled:
        new NotifyAllActorsThatConventionIsCancelled(
          uowPerformer,
          saveNotificationAndRelatedEvent,
        ),

      notifyAllActorsThatConventionIsDeprecated:
        new NotifyAllActorsThatConventionIsDeprecated(
          uowPerformer,
          saveNotificationAndRelatedEvent,
        ),
      deliverRenewedMagicLink: new DeliverRenewedMagicLink(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      notifyConfirmationEstablishmentCreated:
        new NotifyConfirmationEstablishmentCreated(
          uowPerformer,
          saveNotificationAndRelatedEvent,
        ),
      notifyContactRequest: new NotifyContactRequest(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        config.immersionFacileDomain,
        config.immersionFacileBaseUrl,
      ),
      notifyFranceTravailUserAdvisorOnConventionFullySigned:
        new NotifyFranceTravailUserAdvisorOnConventionFullySigned(
          uowPerformer,
          saveNotificationAndRelatedEvent,
          config,
        ),
      notifyAgencyThatAssessmentIsCreated:
        new NotifyAgencyThatAssessmentIsCreated(
          uowPerformer,
          saveNotificationAndRelatedEvent,
          config,
        ),
      notifyAgencyDelegationContact: new NotifyAgencyDelegationContact(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      ),
      broadcastToPartnersOnConventionUpdates:
        new BroadcastToPartnersOnConventionUpdates(
          uowPerformer,
          gateways.subscribersGateway,
          gateways.timeGateway,
          config.apiConsumerNamesUsingRomeV3,
        ),
      subscribeToWebhook: new SubscribeToWebhook(
        uowPerformer,
        uuidGenerator,
        gateways.timeGateway,
      ),
      deleteSubscription: new DeleteSubscription(uowPerformer),
      shareConventionByEmail: new ShareConventionLinkByEmail(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        gateways.shortLinkGenerator,
        config,
      ),
      setFeatureFlag: new SetFeatureFlag(uowPerformer),
      saveApiConsumer: new SaveApiConsumer(
        uowPerformer,
        createNewEvent,
        generateApiConsumerJwt,
        gateways.timeGateway,
      ),
    }),

    getFeatureFlags: useCaseBuilder("GetFeatureFlags")
      .notTransactional()
      .build(() => queries.featureFlag.getAll())({}),

    getLink: useCaseBuilder("GetLink")
      .withInput(z.string())
      .notTransactional()
      .build(({ inputParams }) => queries.shortLink.getById(inputParams))({}),

    getApiConsumerById: useCaseBuilder("GetApiConsumerById")
      .withInput(z.string())
      .build(({ inputParams, uow }) =>
        uow.apiConsumerRepository.getById(inputParams),
      )({ uowPerformer }),

    getAllApiConsumers: useCaseBuilder("GetAllApiConsumers")
      .withCurrentUser<ConnectedUser>()
      .build(({ currentUser, uow }) => {
        throwIfNotAdmin(currentUser);
        return uow.apiConsumerRepository.getAll();
      })({ uowPerformer }),

    isFormEstablishmentWithSiretAlreadySaved: useCaseBuilder(
      "IsFormEstablishmentWithSiretAlreadySaved",
    )
      .withInput(siretSchema)
      .build(({ inputParams: siret, uow }) =>
        uow.establishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          siret,
        ),
      )({ uowPerformer }),

    getImmersionFacileAgencyIdByKind: useCaseBuilder(
      "GetImmersionFacileAgencyIdByKind",
    ).build(async ({ uow }) => {
      const agencyId = await uow.agencyRepository.getImmersionFacileAgencyId();
      if (!agencyId)
        throw new NotFoundError(
          "No agency found with kind immersion-facilitee",
        );
      return agencyId;
    })({ uowPerformer }),

    getLastNotifications: useCaseBuilder("GetLastNotifications")
      .withCurrentUser<ConnectedUser>()
      .build(({ currentUser, uow }) => {
        throwIfNotAdmin(currentUser);
        return uow.notificationRepository.getLastNotifications();
      })({ uowPerformer }),

    findSimilarConventions: useCaseBuilder("FindSimilarConventions")
      .withInput(findSimilarConventionsParamsSchema)
      .withOutput<{ similarConventionIds: ConventionId[] }>()
      .notTransactional()
      .build(({ inputParams }) =>
        queries.convention
          .findSimilarConventions(inputParams)
          .then((similarConventionIds) => ({ similarConventionIds })),
      )({}),

    getOffers: makeGetOffers({
      uowPerformer,
      deps: {
        uuidGenerator,
      },
    }),

    getExternalOffers: makeGetExternalOffers({
      uowPerformer,
      deps: {
        uuidGenerator,
        laBonneBoiteGateway: gateways.laBonneBoiteGateway,
      },
    }),
    addAgenciesAndUsers: makeAddAgenciesAndUsers({
      uowPerformer,
      deps: {
        uuidGenerator,
        timeGateway: gateways.timeGateway,
        addressGateway: gateways.addressApi,
      },
    }),

    updateUserForAgency: makeUpdateUserForAgency({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    }),

    linkFranceTravailUsersToTheirAgencies:
      makeLinkFranceTravailUsersToTheirAgencies({
        uowPerformer,
        deps: {
          createNewEvent,
        },
      }),

    getConnectedUser: makeGetConnectedUser({
      uowPerformer,
      deps: {
        dashboardGateway: gateways.dashboardGateway,
        timeGateway: gateways.timeGateway,
      },
    }),

    getConnectedUsers: makeGetConnectedUsers({
      uowPerformer,
    }),

    getLastBroadcastFeedback: makeGetLastBroadcastFeedback({
      uowPerformer,
    }),

    getConventionsWithErroredBroadcastFeedback:
      makeGetConventionsWithErroredBroadcastFeedback({
        uowPerformer,
      }),

    rejectUserForAgency: makeRejectUserForAgency({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    }),

    updateAgencyStatus: makeUpdateAgencyStatus({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    }),

    updateAgencyReferringToUpdatedAgency:
      makeUpdateAgencyReferringToUpdatedAgency({
        uowPerformer,
        deps: {
          createNewEvent,
        },
      }),

    updateAgency: makeUpdateAgency({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    }),

    listAgencyOptionsByFilter: makeListAgencyOptionsByFilter({
      uowPerformer,
    }),
    privateListAgencies: makePrivateListAgencies({
      uowPerformer,
    }),

    addAgency: makeAddAgency({
      uowPerformer,
      deps: {
        createNewEvent,
        siretGateway: gateways.siret,
        timeGateway: gateways.timeGateway,
        uuidGenerator,
      },
    }),

    registerAgencyToConnectedUser: makeRegisterAgencyToConnectedUser({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    }),

    broadcastToFranceTravailOnConventionUpdates:
      makeBroadcastToFranceTravailOrchestrator({
        uowPerformer,
        broadcastToFranceTravailOnConventionUpdates,
        broadcastToFranceTravailOnConventionUpdatesLegacy,
        eventType: "CONVENTION_UPDATED",
      }),

    broadcastToFranceTravailOnAssessmentCreated:
      makeBroadcastToFranceTravailOrchestrator({
        uowPerformer,
        broadcastToFranceTravailOnConventionUpdates,
        broadcastToFranceTravailOnConventionUpdatesLegacy,
        eventType: "ASSESSMENT_CREATED",
      }),
    notifyEstablishmentThatAssessmentWasCreated:
      makeNotifyEstablishmentThatAssessmentWasCreated({
        uowPerformer,
        deps: {
          saveNotificationAndRelatedEvent,
          generateLink: generateConventionMagicLinkUrl,
          timeGateway: gateways.timeGateway,
        },
      }),
    getAgencyById: makeGetAgencyById({
      uowPerformer,
    }),
    getOAuthLogoutUrl: makeGetOAuthLogoutUrl({
      uowPerformer,
      deps: {
        oAuthGateway: gateways.oAuthGateway,
        ftConnectGateway: gateways.ftConnectGateway,
      },
    }),
    createAssessment: makeCreateAssessment({
      uowPerformer,
      deps: { createNewEvent },
    }),
    getAssessmentByConventionId: makeGetAssessmentByConventionId({
      uowPerformer,
    }),
    notifyBeneficiaryThatAssessmentIsCreated:
      makeNotifyBeneficiaryThatAssessmentIsCreated({
        uowPerformer,
        deps: {
          saveNotificationAndRelatedEvent,
          generateConventionMagicLinkUrl,
          timeGateway: gateways.timeGateway,
        },
      }),
    notifyAllActorsThatConventionHasBeenTransferred:
      makeNotifyAllActorsThatConventionTransferred({
        uowPerformer,
        deps: {
          saveNotificationAndRelatedEvent,
          generateConventionMagicLinkUrl,
          timeGateway: gateways.timeGateway,
          shortLinkIdGeneratorGateway: gateways.shortLinkGenerator,
          config,
        },
      }),
    listActiveSubscriptions: makeListActiveSubscriptions({
      uowPerformer,
    }),
    createUserForAgency: makeCreateUserForAgency({
      uowPerformer,
      deps: {
        timeGateway: gateways.timeGateway,
        createNewEvent,
        dashboardGateway: gateways.dashboardGateway,
      },
    }),
    removeUserFromAgency: makeRemoveUserFromAgency({
      uowPerformer,
      deps: { createNewEvent },
    }),
    broadcastConventionAgain: makeBroadcastConventionAgain({
      uowPerformer,
      deps: { createNewEvent, timeGateway: gateways.timeGateway },
    }),
    getApiConsumersByConvention: makeGetApiConsumersByConvention({
      uowPerformer,
    }),
    markDiscussionLinkedToConvention: makeMarkDiscussionLinkedToConvention({
      uowPerformer,
      deps: {
        timeGateway: gateways.timeGateway,
      },
    }),
    contactRequestReminder: makeContactRequestReminder({
      deps: {
        domain: config.immersionFacileDomain,
        saveNotificationAndRelatedEvent,
        timeGateway: gateways.timeGateway,
      },
      uowPerformer,
    }),
    addFormEstablishmentBatch: makeAddFormEstablishmentBatch({
      deps: {
        insertEstablishmentAggregateFromForm,
        uowPerformer,
      },
    }),
    getEstablishmentStats: makeGetEstablishmentStats({
      uowPerformer,
    }),
    getEstablishmentNameAndAdmins: makeGetEstablishmentNameAndAdmins({
      uowPerformer,
    }),
    updateDiscussionStatus: makeUpdateDiscussionStatus({
      uowPerformer,
      deps: {
        timeGateway: gateways.timeGateway,
        createNewEvent,
      },
    }),
    updateMarketingEstablishmentContactList:
      makeUpdateMarketingEstablishmentContactList({
        deps: {
          establishmentMarketingGateway: gateways.establishmentMarketingGateway,
          timeGateway: gateways.timeGateway,
        },
        uowPerformer,
      }),
    getUsers: makeGetUsers({
      uowPerformer,
    }),
    getExternalSearchResult: makeGetExternalSearchResult({
      deps: {
        laBonneBoiteGateway: gateways.laBonneBoiteGateway,
      },
      uowPerformer,
    }),
    nafSuggestions: makeGetNafSuggestions({ uowPerformer }),
    sendTicketToCrisp: makeSendSupportTicketToCrisp({
      uowPerformer,
      deps: { crispApi: gateways.crispGateway },
    }),
    notifyCandidateThatContactRequestHasBeenSent:
      makeNotifyCandidateThatContactRequestHasBeenSent({
        uowPerformer,
        deps: { saveNotificationAndRelatedEvent },
      }),
    sendSignatureLink: makeSendSignatureLink({
      uowPerformer,
      deps: {
        timeGateway: gateways.timeGateway,
        config,
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl,
        shortLinkIdGeneratorGateway: gateways.shortLinkGenerator,
        createNewEvent,
      },
    }),
    sendAssessmentLink: makeSendAssessmentLink({
      uowPerformer,
      deps: {
        timeGateway: gateways.timeGateway,
        config,
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl,
        shortLinkIdGeneratorGateway: gateways.shortLinkGenerator,
        createNewEvent,
      },
    }),
    getConventionsForAgencyUser: makeGetConventionsForAgencyUser({
      uowPerformer,
    }),
    transferConventionToAgency: makeTransferConventionToAgency({
      uowPerformer,
      deps: { createNewEvent },
    }),
    editConventionCounsellorName: makeEditConventionCounsellorName({
      uowPerformer,
      deps: { createNewEvent },
    }),
    warnSenderThatMessageCouldNotBeDelivered:
      makeWarnSenderThatMessageCouldNotBeDelivered({
        uowPerformer,
        deps: { saveNotificationAndRelatedEvent },
      }),
    initiateLoginByEmail: makeInitiateLoginByEmail({
      uowPerformer,
      deps: {
        uuidGenerator,
        saveNotificationAndRelatedEvent,
        appConfig: config,
        generateEmailAuthCodeJwt,
      },
    }),
    getDiscussions: makeGetDiscussionsForUser({
      uowPerformer,
    }),
    markDiscussionDeprecatedAndNotify: makeMarkDiscussionDeprecatedAndNotify({
      uowPerformer,
      deps: {
        saveNotificationsBatchAndRelatedEvent,
        config,
        timeGateway: gateways.timeGateway,
      },
    }),
    notifyBeneficiaryToFollowUpContactRequest:
      makeNotifyBeneficiaryToFollowUpContactRequest({
        uowPerformer,
        deps: { saveNotificationsBatchAndRelatedEvent, config },
      }),
  } satisfies Record<string, InstantiatedUseCase<any, any, any>>;
};

const dashboardUseCases = (
  gateway: DashboardGateway,
  timeGateway: TimeGateway,
) => ({
  getDashboard: new GetDashboardUrl(gateway, timeGateway),
});

export type UseCases = ReturnType<typeof createUseCases>;

export type InstantiatedUseCase<
  Input = void,
  Output = void,
  JwtPayload = void,
> = {
  useCaseName: string;
  execute: (param: Input, jwtPayload?: JwtPayload) => Promise<Output>;
};

const instantiatedUseCaseFromClass = <
  Input,
  Output,
  Payload extends UseCaseIdentityPayload,
>(
  useCase:
    | TransactionalUseCase<Input, Output, Payload>
    | UseCase<Input, Output, Payload>,
): InstantiatedUseCase<Input, Output, Payload> => ({
  execute: (p, jwtPayload) => useCase.execute(p, jwtPayload),
  useCaseName: useCase.constructor.name,
});

const instantiatedUseCasesFromClasses = <
  T extends Record<
    string,
    TransactionalUseCase<any, any, any> | UseCase<any, any, any>
  >,
>(
  useCases: T,
): {
  [K in keyof T]: T[K] extends TransactionalUseCase<
    infer Input,
    infer Output,
    infer JwtPayload
  >
    ? InstantiatedUseCase<Input, Output, JwtPayload>
    : T[K] extends UseCase<infer Input2, infer Output2, infer JwtPayload2>
      ? InstantiatedUseCase<Input2, Output2, JwtPayload2>
      : never;
} =>
  keys(useCases).reduce(
    (acc, useCaseKey) => ({
      ...acc,
      [useCaseKey]: instantiatedUseCaseFromClass(useCases[useCaseKey]),
    }),
    {} as any,
  );
