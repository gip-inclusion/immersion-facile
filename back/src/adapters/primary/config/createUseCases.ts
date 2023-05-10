import { keys } from "ramda";
import { AgencyId, ApiConsumerId, SiretDto, sleep } from "shared";
import { LookupLocation } from "../../../domain/address/useCases/LookupLocation";
import { LookupStreetAddress } from "../../../domain/address/useCases/LookupStreetAddress";
import {
  GenerateAuthenticatedUserJwt,
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../../domain/auth/jwt";
import { ExportData } from "../../../domain/backoffice/useCases/ExportData";
import { SetFeatureFlag } from "../../../domain/backoffice/useCases/SetFeatureFlag";
import { AddConvention } from "../../../domain/convention/useCases/AddConvention";
import { AddAgency } from "../../../domain/convention/useCases/agencies/AddAgency";
import { ListAgenciesByFilter } from "../../../domain/convention/useCases/agencies/ListAgenciesByFilter";
import { PrivateListAgencies } from "../../../domain/convention/useCases/agencies/PrivateListAgencies";
import { RegisterAgencyToInclusionConnectUser } from "../../../domain/convention/useCases/agencies/RegisterAgencyToInclusionConnectUser";
import { UpdateAgency } from "../../../domain/convention/useCases/agencies/UpdateAgency";
import { UpdateAgencyStatus } from "../../../domain/convention/useCases/agencies/UpdateAgencyStatus";
import { BroadcastToPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/broadcast/BroadcastToPoleEmploiOnConventionUpdates";
import { CreateImmersionAssessment } from "../../../domain/convention/useCases/CreateImmersionAssessment";
import { GenerateConventionMagicLinkUseCase } from "../../../domain/convention/useCases/GenerateConventionMagicLinkUseCase";
import { GetAgencyPublicInfoById } from "../../../domain/convention/useCases/GetAgencyPublicInfoById";
import { GetConvention } from "../../../domain/convention/useCases/GetConvention";
import { ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalConventionValidation } from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalConventionValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyConventionReminder } from "../../../domain/convention/useCases/notifications/NotifyConventionReminder";
import { NotifyLastSigneeThatConventionHasBeenSigned } from "../../../domain/convention/useCases/notifications/NotifyLastSigneeThatConventionHasBeenSigned";
import { NotifyNewApplicationNeedsReview } from "../../../domain/convention/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/convention/useCases/notifications/NotifyToAgencyApplicationSubmitted";
import { RenewConventionMagicLink } from "../../../domain/convention/useCases/RenewConventionMagicLink";
import { SendEmailWhenAgencyIsActivated } from "../../../domain/convention/useCases/SendEmailWhenAgencyIsActivated";
import { ShareApplicationLinkByEmail } from "../../../domain/convention/useCases/ShareApplicationLinkByEmail";
import { SignConvention } from "../../../domain/convention/useCases/SignConvention";
import { UpdateConvention } from "../../../domain/convention/useCases/UpdateConvention";
import { UpdateConventionStatus } from "../../../domain/convention/useCases/UpdateConventionStatus";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { TransactionalUseCase, UseCase } from "../../../domain/core/UseCase";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { GetDashboardUrl } from "../../../domain/dashboard/useCases/GetDashboardUrl";
import { ValidateEmail } from "../../../domain/emailValidation/useCases/ValidateEmail";
import { AdminLogin } from "../../../domain/generic/authentication/useCases/AdminLogin";
import { UploadLogo } from "../../../domain/generic/fileManagement/useCases/UploadLogo";
import { GetSentEmails } from "../../../domain/generic/notifications/useCases/GetSentEmails";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { AddFormEstablishmentBatch } from "../../../domain/immersionOffer/useCases/AddFormEstablismentsBatch";
import { CallLaBonneBoiteAndUpdateRepositories } from "../../../domain/immersionOffer/useCases/CallLaBonneBoiteAndUpdateRepositories";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";
import { GetImmersionOfferById } from "../../../domain/immersionOffer/useCases/GetImmersionOfferById";
import { GetImmersionOfferBySiretAndRome } from "../../../domain/immersionOffer/useCases/GetImmersionOfferBySiretAndRome";
import { GetOffersByGroupSlug } from "../../../domain/immersionOffer/useCases/GetOffersByGroupSlug";
import { InsertDiscussionAggregateFromContactRequest } from "../../../domain/immersionOffer/useCases/InsertDiscussionAggregateFromContactRequest";
import { InsertEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/InsertEstablishmentAggregateFromFormEstablishement";
import { NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../../domain/immersionOffer/useCases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import { AuthenticateWithInclusionCode } from "../../../domain/inclusionConnect/useCases/AuthenticateWithInclusionCode";
import { InitiateInclusionConnect } from "../../../domain/inclusionConnect/useCases/InitiateInclusionConnect";
import { GetInclusionConnectedUser } from "../../../domain/inclusionConnectedUsers/useCases/GetInclusionConnectedUser";
import { GetInclusionConnectedUsers } from "../../../domain/inclusionConnectedUsers/useCases/GetInclusionConnectedUsers";
import { UpdateIcUserRoleForAgency } from "../../../domain/inclusionConnectedUsers/useCases/UpdateIcUserRoleForAgency";
import { BindConventionToFederatedIdentity } from "../../../domain/peConnect/useCases/BindConventionToFederatedIdentity";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { NotFoundError } from "../helpers/httpErrors";
import { AppConfig } from "./appConfig";
import { Gateways } from "./createGateways";
import {
  makeGenerateConventionMagicLinkUrl,
  makeGenerateEditFormEstablishmentUrl,
} from "./magicLinkUrl";

export const createUseCases = (
  config: AppConfig,
  gateways: Gateways,
  generateConventionJwt: GenerateConventionJwt,
  generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt,
  generateBackOfficeJwt: GenerateBackOfficeJwt,
  generateAuthenticatedUserToken: GenerateAuthenticatedUserJwt,
  uowPerformer: UnitOfWorkPerformer,
  uuidGenerator: UuidGenerator,
) => {
  const createNewEvent = makeCreateNewEvent({
    timeGateway: gateways.timeGateway,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const addFormEstablishment = new AddFormEstablishment(
    uowPerformer,
    createNewEvent,
    gateways.siren,
  );

  const generateConventionMagicLinkUrl = makeGenerateConventionMagicLinkUrl(
    config,
    generateConventionJwt,
  );

  return {
    ...instantiatedUseCasesFromClasses({
      registerAgencyToInclusionConnectUser:
        new RegisterAgencyToInclusionConnectUser(uowPerformer, createNewEvent),
      updateIcUserRoleForAgency: new UpdateIcUserRoleForAgency(uowPerformer),
      getIcUsers: new GetInclusionConnectedUsers(uowPerformer),
      getUserAgencyDashboardUrl: new GetInclusionConnectedUser(
        uowPerformer,
        gateways.dashboardGateway,
        gateways.timeGateway,
      ),
      initiateInclusionConnect: new InitiateInclusionConnect(
        uowPerformer,
        uuidGenerator,
        config.inclusionConnectConfig,
      ),
      authenticateWithInclusionCode: new AuthenticateWithInclusionCode(
        uowPerformer,
        createNewEvent,
        gateways.inclusionConnectGateway,
        uuidGenerator,
        generateAuthenticatedUserToken,
        config.immersionFacileBaseUrl,
      ),
      bindConventionToFederatedIdentity: new BindConventionToFederatedIdentity(
        uowPerformer,
        createNewEvent,
      ),
      uploadLogo: new UploadLogo(
        uowPerformer,
        gateways.documentGateway,
        uuidGenerator,
      ),

      // Address
      lookupStreetAddress: new LookupStreetAddress(gateways.addressApi),
      lookupLocation: new LookupLocation(gateways.addressApi),

      // Admin
      adminLogin: new AdminLogin(
        config.backofficeUsername,
        config.backofficePassword,
        generateBackOfficeJwt,
        () => sleep(config.nodeEnv !== "test" ? 500 : 0),
        gateways.timeGateway,
      ),
      getSentEmails: new GetSentEmails(gateways.email),
      exportData: new ExportData(uowPerformer, gateways.exportGateway),
      addFormEstablishmentBatch: new AddFormEstablishmentBatch(
        addFormEstablishment,
        uowPerformer,
      ),

      // Conventions
      createImmersionAssessment: new CreateImmersionAssessment(
        uowPerformer,
        createNewEvent,
      ),
      addConvention: new AddConvention(
        uowPerformer,
        createNewEvent,
        gateways.siren,
      ),
      getConvention: new GetConvention(uowPerformer),
      linkPoleEmploiAdvisorAndRedirectToConvention:
        new LinkPoleEmploiAdvisorAndRedirectToConvention(
          uowPerformer,
          gateways.peConnectGateway,
          config.immersionFacileBaseUrl,
        ),

      updateConvention: new UpdateConvention(uowPerformer, createNewEvent),
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
      generateMagicLink: new GenerateConventionMagicLinkUseCase(
        generateConventionJwt,
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
      notifyConventionReminder: new NotifyConventionReminder(
        uowPerformer,
        gateways.email,
        gateways.timeGateway,
        generateConventionMagicLinkUrl,
      ),

      // immersionOffer
      searchImmersion: new SearchImmersion(uowPerformer, uuidGenerator),
      getOffersByGroupSlug: new GetOffersByGroupSlug(uowPerformer),
      getImmersionOfferById: new GetImmersionOfferById(uowPerformer),
      getImmersionOfferBySiretAndRome: new GetImmersionOfferBySiretAndRome(
        uowPerformer,
      ),

      addFormEstablishment,

      editFormEstablishment: new EditFormEstablishment(
        uowPerformer,
        createNewEvent,
      ),
      retrieveFormEstablishmentFromAggregates:
        new RetrieveFormEstablishmentFromAggregates(uowPerformer),
      updateEstablishmentAggregateFromForm:
        new UpdateEstablishmentAggregateFromForm(
          uowPerformer,
          gateways.addressApi,
          uuidGenerator,
          gateways.timeGateway,
        ),
      insertEstablishmentAggregateFromForm:
        new InsertEstablishmentAggregateFromForm(
          uowPerformer,
          gateways.siren,
          gateways.addressApi,
          uuidGenerator,
          gateways.timeGateway,
          createNewEvent,
        ),
      contactEstablishment: new ContactEstablishment(
        uowPerformer,
        createNewEvent,
      ),
      insertDiscussionAggregateFromContactRequest:
        new InsertDiscussionAggregateFromContactRequest(
          uowPerformer,
          gateways.timeGateway,
          uuidGenerator,
        ),
      callLaBonneBoiteAndUpdateRepositories:
        new CallLaBonneBoiteAndUpdateRepositories(
          uowPerformer,
          gateways.laBonneBoiteAPI,
          gateways.timeGateway,
        ),
      requestEditFormEstablishment: new RequestEditFormEstablishment(
        uowPerformer,
        gateways.email,
        gateways.timeGateway,
        makeGenerateEditFormEstablishmentUrl(
          config,
          generateEditEstablishmentJwt,
        ),
        createNewEvent,
      ),

      notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm:
        new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
          gateways.passEmploiGateway,
        ),

      // siret
      getSiret: new GetSiret(gateways.siren),
      getSiretIfNotAlreadySaved: new GetSiretIfNotAlreadySaved(
        uowPerformer,
        gateways.siren,
      ),

      // romes
      appellationSearch: new AppellationSearch(uowPerformer),
      romeSearch: new RomeSearch(uowPerformer),

      // email validation
      validateEmail: new ValidateEmail(gateways.emailValidationGateway),

      // agencies
      listAgenciesByFilter: new ListAgenciesByFilter(uowPerformer),
      privateListAgencies: new PrivateListAgencies(uowPerformer),
      getAgencyPublicInfoById: new GetAgencyPublicInfoById(uowPerformer),
      sendEmailWhenAgencyIsActivated: new SendEmailWhenAgencyIsActivated(
        gateways.email,
      ),
      // METABASE
      ...dashboardUseCases(gateways.dashboardGateway, gateways.timeGateway),
      // notifications
      confirmToSignatoriesThatConventionCorrectlySubmittedRequestSignature:
        new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
          uowPerformer,
          gateways.email,
          gateways.timeGateway,
          gateways.shortLinkGenerator,
          generateConventionMagicLinkUrl,
          config,
        ),
      notifyLastSigneeThatConventionHasBeenSigned:
        new NotifyLastSigneeThatConventionHasBeenSigned(
          uowPerformer,
          gateways.email,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
        ),
      notifyAllActorsOfFinalConventionValidation:
        new NotifyAllActorsOfFinalConventionValidation(
          uowPerformer,
          gateways.email,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
        ),
      notifyNewConventionNeedsReview: new NotifyNewApplicationNeedsReview(
        uowPerformer,
        gateways.email,
        generateConventionMagicLinkUrl,
        gateways.timeGateway,
        gateways.shortLinkGenerator,
        config,
      ),
      notifyToAgencyConventionSubmitted: new NotifyToAgencyApplicationSubmitted(
        uowPerformer,
        gateways.email,
        generateConventionMagicLinkUrl,
        gateways.timeGateway,
      ),
      notifyBeneficiaryAndEnterpriseThatConventionIsRejected:
        new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
          uowPerformer,
          gateways.email,
        ),
      notifyBeneficiaryAndEnterpriseThatConventionNeedsModifications:
        new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
          uowPerformer,
          gateways.email,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
          gateways.shortLinkGenerator,
          config,
        ),
      deliverRenewedMagicLink: new DeliverRenewedMagicLink(gateways.email),
      notifyConfirmationEstablishmentCreated:
        new NotifyConfirmationEstablishmentCreated(gateways.email),
      notifyContactRequest: new NotifyContactRequest(
        uowPerformer,
        gateways.email,
      ),
      notifyPoleEmploiUserAdvisorOnConventionFullySigned:
        new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
          uowPerformer,
          gateways.email,
          generateConventionMagicLinkUrl,
          gateways.timeGateway,
        ),
      broadcastToPoleEmploiOnConventionUpdates:
        new BroadcastToPoleEmploiOnConventionUpdates(
          uowPerformer,
          gateways.poleEmploiGateway,
        ),
      shareConventionByEmail: new ShareApplicationLinkByEmail(gateways.email),
      addAgency: new AddAgency(uowPerformer, createNewEvent),
      updateAgencyStatus: new UpdateAgencyStatus(uowPerformer, createNewEvent),
      updateAgencyAdmin: new UpdateAgency(uowPerformer, createNewEvent),
      setFeatureFlag: new SetFeatureFlag(uowPerformer),
    }),
    ...instantiatedUseCasesFromFunctions({
      getFeatureFlags: (_: void) =>
        uowPerformer.perform((uow) => uow.featureFlagRepository.getAll()),
      getLink: (shortLinkId: ShortLinkId) =>
        uowPerformer.perform((uow) => uow.shortLinkQuery.getById(shortLinkId)),
      getApiConsumerById: (id: ApiConsumerId) =>
        uowPerformer.perform((uow) => uow.apiConsumerRepository.getById(id)),
      getAgencyById: (id: AgencyId) =>
        uowPerformer.perform(async (uow) => {
          const [agency] = await uow.agencyRepository.getByIds([id]);
          return agency;
        }),
      isFormEstablishmentWithSiretAlreadySaved: (siret: SiretDto) =>
        uowPerformer.perform((uow) =>
          uow.establishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
            siret,
          ),
        ),
      getImmersionFacileAgencyIdByKind: (_: void) =>
        uowPerformer.perform(async (uow) => {
          const agencyId =
            await uow.agencyRepository.getImmersionFacileAgencyId();
          if (!agencyId) {
            throw new NotFoundError(
              `No agency found with kind immersion-facilitee`,
            );
          }
          return agencyId;
        }),
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

const instantiatedUseCaseFromClass = <Input, Output, JwtPayload>(
  useCase:
    | TransactionalUseCase<Input, Output, JwtPayload>
    | UseCase<Input, Output, JwtPayload>,
): InstantiatedUseCase<Input, Output, JwtPayload> => ({
  execute: (p, jwtPayload) => useCase.execute(p, jwtPayload),
  useCaseName: useCase.constructor.name,
});

const createInstantiatedUseCase = <Input = void, Output = void>(params: {
  useCaseName: string;
  execute: (params: Input) => Promise<Output>;
}): InstantiatedUseCase<Input, Output, unknown> => params;

const instantiatedUseCasesFromFunctions = <
  T extends Record<string, (params: any) => Promise<unknown>>,
>(
  lamdas: T,
): {
  [K in keyof T]: T[K] extends (p: infer Input) => Promise<infer Output>
    ? InstantiatedUseCase<Input, Output, any>
    : never;
} =>
  keys(lamdas).reduce(
    (acc, key) => ({
      ...acc,
      [key]: createInstantiatedUseCase({
        useCaseName: key as string,
        execute: lamdas[key],
      }),
    }),
    {} as any,
  );

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
