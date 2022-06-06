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
import { AddImmersionApplication } from "../../../domain/convention/useCases/AddImmersionApplication";
import { ExportImmersionApplicationsReport } from "../../../domain/convention/useCases/ExportImmersionApplicationsReport";
import { GenerateMagicLink } from "../../../domain/convention/useCases/GenerateMagicLink";
import { GetAgencyPublicInfoById } from "../../../domain/convention/useCases/GetAgencyPublicInfoById";
import { GetImmersionApplication } from "../../../domain/convention/useCases/GetImmersionApplication";
import { ListAgencies } from "../../../domain/convention/useCases/ListAgencies";
import { ListImmersionApplication } from "../../../domain/convention/useCases/ListImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyImmersionApplicationWasSignedByOtherParty } from "../../../domain/convention/useCases/notifications/NotifyImmersionApplicationWasSignedByOtherParty";
import { NotifyNewApplicationNeedsReview } from "../../../domain/convention/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/convention/useCases/notifications/NotifyToAgencyApplicationSubmitted";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/convention/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { RenewMagicLink } from "../../../domain/convention/useCases/RenewMagicLink";
import { ShareApplicationLinkByEmail } from "../../../domain/convention/useCases/ShareApplicationLinkByEmail";
import { SignImmersionApplication } from "../../../domain/convention/useCases/SignImmersionApplication";
import { UpdateImmersionApplication } from "../../../domain/convention/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../../domain/convention/useCases/UpdateImmersionApplicationStatus";
import { ValidateImmersionApplication } from "../../../domain/convention/useCases/ValidateImmersionApplication";
import { CreateImmersionAssessment } from "../../../domain/convention/useCases/CreateImmersionAssessment";
import { AddAgency } from "../../../domain/convention/useCases/AddAgency";
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
import { NotifyPoleEmploiUserAdvisorOnConventionAssociation } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionAssociation";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { HttpAdresseAPI } from "../../secondary/immersionOffer/HttpAdresseAPI";
import { AppConfig } from "./appConfig";
import { GenerateConventionMagicLink } from "./createGenerateConventionMagicLink";
import { makeGenerateEditFormEstablishmentUrl } from "./makeGenerateEditFormEstablishmentUrl";
import { Repositories } from "./repositoriesConfig";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";

export type UseCases = ReturnType<typeof createUseCases>;

export const createUseCases = (
  config: AppConfig,
  repositories: Repositories,
  generateJwtFn: GenerateMagicLinkJwt,
  generateMagicLinkFn: GenerateConventionMagicLink,
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
      new AssociatePeConnectFederatedIdentity(uowPerformer, createNewEvent),
    uploadFile: new UploadFile(uowPerformer, repositories.documentGateway),
    createImmersionAssessment: new CreateImmersionAssessment(
      uowPerformer,
      createNewEvent,
    ),
    addConvention: new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),
    getConvention: new GetImmersionApplication(repositories.convention),
    linkPoleEmploiAdvisorAndRedirectToConvention:
      new LinkPoleEmploiAdvisorAndRedirectToConvention(
        uowPerformer,
        repositories.peConnectGateway,
        config.immersionFacileBaseUrl,
      ),
    listConventions: new ListImmersionApplication(
      repositories.conventionQueries,
    ),
    exportConventionsAsExcelArchive: new ExportImmersionApplicationsReport(
      uowPerformer,
    ),

    exportEstablishmentsAsExcelArchive: new ExportEstablishmentsAsExcelArchive(
      uowPerformer,
    ),

    updateConvention: new UpdateImmersionApplication(
      uowPerformer,
      createNewEvent,
    ),
    validateConvention: new ValidateImmersionApplication(
      repositories.convention,
      createNewEvent,
      repositories.outbox,
    ),
    updateConventionStatus: new UpdateImmersionApplicationStatus(
      repositories.convention,
      createNewEvent,
      repositories.outbox,
    ),
    signConvention: new SignImmersionApplication(
      repositories.convention,
      createNewEvent,
      repositories.outbox,
    ),
    generateMagicLink: new GenerateMagicLink(generateJwtFn),
    renewMagicLink: new RenewMagicLink(
      repositories.convention,
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
    confirmToBeneficiaryThatConventionCorrectlySubmittedRequestSignature:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    confirmToMentorThatConventionCorrectlySubmittedRequestSignature:
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyAllActorsOfFinalConventionValidation:
      new NotifyAllActorsOfFinalApplicationValidation(
        emailFilter,
        repositories.email,
        repositories.agency,
      ),
    notifyNewConventionNeedsReview: new NotifyNewApplicationNeedsReview(
      repositories.email,
      repositories.agency,
      generateMagicLinkFn,
    ),
    notifyToTeamConventionSubmittedByBeneficiary:
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
    notifyToAgencyConventionSubmitted: new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailFilter,
      repositories.email,
      generateMagicLinkFn,
    ),
    notifyBeneficiaryAndEnterpriseThatConventionIsRejected:
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailFilter,
        repositories.email,
        repositories.agency,
      ),
    notifyBeneficiaryAndEnterpriseThatConventionNeedsModifications:
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
    notifyBeneficiaryOrEnterpriseThatConventionWasSignedByOtherParty:
      new NotifyImmersionApplicationWasSignedByOtherParty(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyPoleEmploiUserAdvisorOnAssociation:
      new NotifyPoleEmploiUserAdvisorOnConventionAssociation(
        uowPerformer,
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyPoleEmploiUserAdvisorOnConventionFullySigned:
      new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
        uowPerformer,
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    shareConventionByEmail: new ShareApplicationLinkByEmail(repositories.email),
    addAgency: new AddAgency(
      uowPerformer,
      createNewEvent,
      config.defaultAdminEmail,
    ),
  };
};
