import { GenerateMagicLinkJwt } from "../../../domain/auth/jwt";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { Clock } from "../../../domain/core/ports/Clock";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { ExportEstablishmentsAsExcelArchive } from "../../../domain/establishment/useCases/ExportEstablishmentsAsExcelArchive";
import { UploadFile } from "../../../domain/generic/fileManagement/useCases/UploadFile";
import { AddImmersionApplication } from "../../../domain/immersionApplication/useCases/AddImmersionApplication";
import { ExportImmersionApplicationsReport } from "../../../domain/immersionApplication/useCases/ExportImmersionApplicationsReport";
import { GenerateMagicLink } from "../../../domain/immersionApplication/useCases/GenerateMagicLink";
import { GetAgencyPublicInfoById } from "../../../domain/immersionApplication/useCases/GetAgencyPublicInfoById";
import { GetImmersionApplication } from "../../../domain/immersionApplication/useCases/GetImmersionApplication";
import { ListAgencies } from "../../../domain/immersionApplication/useCases/ListAgencies";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../../domain/immersionApplication/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyImmersionApplicationWasSignedByOtherParty } from "../../../domain/immersionApplication/useCases/notifications/NotifyImmersionApplicationWasSignedByOtherParty";
import { NotifyNewApplicationNeedsReview } from "../../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/immersionApplication/useCases/notifications/NotifyToAgencyApplicationSubmitted";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { RenewMagicLink } from "../../../domain/immersionApplication/useCases/RenewMagicLink";
import { ShareApplicationLinkByEmail } from "../../../domain/immersionApplication/useCases/ShareApplicationLinkByEmail";
import { SignImmersionApplication } from "../../../domain/immersionApplication/useCases/SignImmersionApplication";
import { UpdateImmersionApplication } from "../../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { ValidateImmersionApplication } from "../../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { CreateImmersionAssessment } from "../../../domain/immersionApplication/useCases/CreateImmersionAssessment";
import { AddAgency } from "../../../domain/immersionApplication/useCases/AddAgency";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { CallLaBonneBoiteAndUpdateRepositories } from "../../../domain/immersionOffer/useCases/CallLaBonneBoiteAndUpdateRepositories";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";
import { GetImmersionOfferById } from "../../../domain/immersionOffer/useCases/GetImmersionOfferById";
import { GetImmersionOfferBySiretAndRome } from "../../../domain/immersionOffer/useCases/GetImmersionOfferBySiretAndRome";
import { InsertEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/InsertEstablishmentAggregateFromFormEstablishement";
import { NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../../domain/immersionOffer/useCases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { HttpAdresseAPI } from "../../secondary/immersionOffer/HttpAdresseAPI";
import { AppConfig } from "./appConfig";
import { GenerateVerificationMagicLink } from "./createGenerateVerificationMagicLink";
import { makeGenerateEditFormEstablishmentUrl } from "./makeGenerateEditFormEstablishmentUrl";
import { Repositories } from "./repositoriesConfig";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";

export type UseCases = ReturnType<typeof createUseCases>;

export const createUseCases = (
  config: AppConfig,
  repositories: Repositories,
  generateJwtFn: GenerateMagicLinkJwt,
  generateMagicLinkFn: GenerateVerificationMagicLink,
  emailFilter: EmailFilter,
  uowPerformer: UnitOfWorkPerformer,
  clock: Clock,
  uuidGenerator: UuidGenerator,
) => {
  const createNewEvent = makeCreateNewEvent({
    clock,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const getSiret = new GetSiret(repositories.sirene);
  const adresseAPI = new HttpAdresseAPI(noRateLimit, noRetries);

  return {
    associatePeConnectFederatedIdentity:
      new AssociatePeConnectFederatedIdentity(uowPerformer),
    uploadFile: new UploadFile(uowPerformer, repositories.documentGateway),
    createImmersionAssessment: new CreateImmersionAssessment(
      uowPerformer,
      createNewEvent,
    ),
    addImmersionApplication: new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),
    getImmersionApplication: new GetImmersionApplication(
      repositories.immersionApplication,
    ),
    linkPoleEmploiAdvisorAndRedirectToConvention:
      new LinkPoleEmploiAdvisorAndRedirectToConvention(
        uowPerformer,
        repositories.peConnectGateway,
        config.immersionFacileBaseUrl,
      ),
    listImmersionApplication: new ListImmersionApplication(
      repositories.immersionApplicationQueries,
    ),
    exportImmersionApplicationsAsExcelArchive:
      new ExportImmersionApplicationsReport(uowPerformer),

    exportEstablishmentsAsExcelArchive: new ExportEstablishmentsAsExcelArchive(
      uowPerformer,
    ),

    updateImmersionApplication: new UpdateImmersionApplication(
      uowPerformer,
      createNewEvent,
    ),
    validateImmersionApplication: new ValidateImmersionApplication(
      repositories.immersionApplication,
      createNewEvent,
      repositories.outbox,
    ),
    updateImmersionApplicationStatus: new UpdateImmersionApplicationStatus(
      repositories.immersionApplication,
      createNewEvent,
      repositories.outbox,
    ),
    signImmersionApplication: new SignImmersionApplication(
      repositories.immersionApplication,
      createNewEvent,
      repositories.outbox,
    ),
    generateMagicLink: new GenerateMagicLink(generateJwtFn),
    renewMagicLink: new RenewMagicLink(
      repositories.immersionApplication,
      createNewEvent,
      repositories.outbox,
      repositories.agency,
      generateJwtFn,
      config,
      clock,
    ),

    // immersionOffer
    searchImmersion: new SearchImmersion(
      repositories.searchesMade,
      repositories.immersionOffer,
      uuidGenerator,
    ),
    getImmersionOfferById: new GetImmersionOfferById(
      repositories.immersionOffer,
    ),
    getImmersionOfferBySiretAndRome: new GetImmersionOfferBySiretAndRome(
      repositories.immersionOffer,
    ),

    addFormEstablishment: new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),

    editFormEstablishment: new EditFormEstablishment(
      uowPerformer,
      createNewEvent,
    ),
    retrieveFormEstablishmentFromAggregates:
      new RetrieveFormEstablishmentFromAggregates(uowPerformer),
    updateEstablishmentAggregateFromForm:
      new UpdateEstablishmentAggregateFromForm(
        uowPerformer,
        repositories.sirene,
        adresseAPI,
        uuidGenerator,
        clock,
      ),
    insertEstablishmentAggregateFromForm:
      new InsertEstablishmentAggregateFromForm(
        uowPerformer,
        repositories.sirene,
        adresseAPI,
        uuidGenerator,
        clock,
        createNewEvent,
      ),
    contactEstablishment: new ContactEstablishment(
      uowPerformer,
      createNewEvent,
    ),

    callLaBonneBoiteAndUpdateRepositories:
      new CallLaBonneBoiteAndUpdateRepositories(
        repositories.immersionOffer,
        repositories.laBonneBoiteRequest,
        repositories.laBonneBoiteAPI,
        uuidGenerator,
        clock,
      ),
    requestEditFormEstablishment: new RequestEditFormEstablishment(
      uowPerformer,
      repositories.email,
      clock,
      makeGenerateEditFormEstablishmentUrl(config),
      createNewEvent,
    ),

    notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm:
      new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
        repositories.passEmploiGateway,
      ),

    // siret
    getSiret,
    getSiretIfNotAlreadySaved: new GetSiretIfNotAlreadySaved(
      uowPerformer,
      repositories.sirene,
    ),

    // romes
    appellationSearch: new AppellationSearch(uowPerformer),
    romeSearch: new RomeSearch(uowPerformer),

    // agencies
    listAgencies: new ListAgencies(repositories.agency),
    getAgencyPublicInfoById: new GetAgencyPublicInfoById(repositories.agency),

    // notifications
    confirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    confirmToMentorThatApplicationCorrectlySubmittedRequestSignature:
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyAllActorsOfFinalApplicationValidation:
      new NotifyAllActorsOfFinalApplicationValidation(
        emailFilter,
        repositories.email,
        repositories.agency,
      ),
    notifyNewApplicationNeedsReview: new NotifyNewApplicationNeedsReview(
      repositories.email,
      repositories.agency,
      generateMagicLinkFn,
    ),
    notifyToTeamApplicationSubmittedByBeneficiary:
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
    notifyToAgencyApplicationSubmitted: new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailFilter,
      repositories.email,
      generateMagicLinkFn,
    ),
    notifyBeneficiaryAndEnterpriseThatApplicationIsRejected:
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailFilter,
        repositories.email,
        repositories.agency,
      ),
    notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications:
      new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
        emailFilter,
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
    deliverRenewedMagicLink: new DeliverRenewedMagicLink(
      emailFilter,
      repositories.email,
    ),
    notifyConfirmationEstablishmentCreated:
      new NotifyConfirmationEstablishmentCreated(
        emailFilter,
        repositories.email,
      ),
    notifyContactRequest: new NotifyContactRequest(
      repositories.immersionOffer,
      emailFilter,
      repositories.email,
    ),
    notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty:
      new NotifyImmersionApplicationWasSignedByOtherParty(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    shareApplicationByEmail: new ShareApplicationLinkByEmail(
      repositories.email,
    ),
    addAgency: new AddAgency(
      uowPerformer,
      createNewEvent,
      config.defaultAdminEmail,
    ),
  };
};
