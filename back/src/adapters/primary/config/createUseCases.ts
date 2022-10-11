import { keys } from "ramda";
import { AgencyId, ApiConsumerId, SiretDto, sleep } from "shared";
import { DepartmentCodeFromPostcode } from "../../../domain/address/useCases/DepartmentCodeFromPostCode";
import { LookupStreetAddress } from "../../../domain/address/useCases/LookupStreetAddress";
import {
  GenerateAdminJwt,
  GenerateMagicLinkJwt,
} from "../../../domain/auth/jwt";
import { ExportData } from "../../../domain/backoffice/useCases/ExportData";
import { SetFeatureFlag } from "../../../domain/backoffice/useCases/SetFeatureFlag";
import { AddConvention } from "../../../domain/convention/useCases/AddConvention";
import { AddAgency } from "../../../domain/convention/useCases/agencies/AddAgency";
import { PrivateListAgencies } from "../../../domain/convention/useCases/agencies/PrivateListAgencies";
import { UpdateAgency } from "../../../domain/convention/useCases/agencies/UpdateAgency";
import { BroadcastToPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/broadcast/BroadcastToPoleEmploiOnConventionUpdates";
import { CreateImmersionAssessment } from "../../../domain/convention/useCases/CreateImmersionAssessment";
import { GenerateMagicLink } from "../../../domain/convention/useCases/GenerateMagicLink";
import { GetAgencyPublicInfoById } from "../../../domain/convention/useCases/GetAgencyPublicInfoById";
import { GetConvention } from "../../../domain/convention/useCases/GetConvention";
import { ListAgenciesByFilter } from "../../../domain/convention/useCases/ListAgenciesByFilter";

import { ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalConventionValidation } from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalConventionValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyNewApplicationNeedsReview } from "../../../domain/convention/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/convention/useCases/notifications/NotifyToAgencyApplicationSubmitted";

import { RenewConventionMagicLink } from "../../../domain/convention/useCases/RenewConventionMagicLink";
import { SendEmailWhenAgencyIsActivated } from "../../../domain/convention/useCases/SendEmailWhenAgencyIsActivated";
import { ShareApplicationLinkByEmail } from "../../../domain/convention/useCases/ShareApplicationLinkByEmail";
import { SignConvention } from "../../../domain/convention/useCases/SignConvention";

import { UpdateConvention } from "../../../domain/convention/useCases/UpdateConvention";
import { UpdateConventionStatus } from "../../../domain/convention/useCases/UpdateConventionStatus";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { Clock } from "../../../domain/core/ports/Clock";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { TransactionalUseCase, UseCase } from "../../../domain/core/UseCase";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { AgencyDashboard } from "../../../domain/dashboard/useCases/AgencyDashboard";
import { ConventionDashboard } from "../../../domain/dashboard/useCases/ConventionDashboard";
import { AdminLogin } from "../../../domain/generic/authentication/useCases/AdminLogin";
import { UploadLogo } from "../../../domain/generic/fileManagement/useCases/UploadLogo";
import { GetSentEmails } from "../../../domain/generic/notifications/useCases/GetSentEmails";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { CallLaBonneBoiteAndUpdateRepositories } from "../../../domain/immersionOffer/useCases/CallLaBonneBoiteAndUpdateRepositories";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";
import { GetImmersionOfferById } from "../../../domain/immersionOffer/useCases/GetImmersionOfferById";
import { GetImmersionOfferBySiretAndRome } from "../../../domain/immersionOffer/useCases/GetImmersionOfferBySiretAndRome";
import { InsertDiscussionAggregateFromContactRequest } from "../../../domain/immersionOffer/useCases/InsertDiscussionAggregateFromContactRequest";
import { InsertEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/InsertEstablishmentAggregateFromFormEstablishement";
import { NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../../domain/immersionOffer/useCases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { NotifyPoleEmploiUserAdvisorOnConventionAssociation } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionAssociation";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { AppConfig } from "./appConfig";
import { Gateways } from "./createGateways";
import { GenerateConventionMagicLink } from "./createGenerateConventionMagicLink";
import { makeGenerateEditFormEstablishmentUrl } from "./makeGenerateEditFormEstablishmentUrl";

export const createUseCases = (
  config: AppConfig,
  gateways: Gateways,
  generateJwtFn: GenerateMagicLinkJwt,
  generateMagicLinkFn: GenerateConventionMagicLink,
  generateAdminJwt: GenerateAdminJwt,
  uowPerformer: UnitOfWorkPerformer,
  clock: Clock,
  uuidGenerator: UuidGenerator,
) => {
  const createNewEvent = makeCreateNewEvent({
    clock,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const getSiret = new GetSiret(gateways.sirene);

  return {
    ...instantiatedUseCasesFromClasses({
      associatePeConnectFederatedIdentity:
        new AssociatePeConnectFederatedIdentity(uowPerformer, createNewEvent),
      uploadLogo: new UploadLogo(
        uowPerformer,
        gateways.documentGateway,
        uuidGenerator,
      ),

      // Address
      lookupStreetAddress: new LookupStreetAddress(gateways.addressApi),
      departmentCodeFromPostcode: new DepartmentCodeFromPostcode(
        gateways.addressApi,
      ),

      // Admin
      adminLogin: new AdminLogin(
        config.backofficeUsername,
        config.backofficePassword,
        generateAdminJwt,
        () => sleep(config.nodeEnv !== "test" ? 500 : 0),
      ),
      getSentEmails: new GetSentEmails(gateways.email),
      exportData: new ExportData(uowPerformer, gateways.exportGateway),

      // Conventions
      createImmersionAssessment: new CreateImmersionAssessment(
        uowPerformer,
        createNewEvent,
      ),
      addConvention: new AddConvention(uowPerformer, createNewEvent, getSiret),
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
        clock,
      ),
      signConvention: new SignConvention(uowPerformer, createNewEvent, clock),
      generateMagicLink: new GenerateMagicLink(generateJwtFn),
      renewConventionMagicLink: new RenewConventionMagicLink(
        uowPerformer,
        createNewEvent,
        generateJwtFn,
        config,
        clock,
      ),

      // immersionOffer
      searchImmersion: new SearchImmersion(uowPerformer, uuidGenerator),
      getImmersionOfferById: new GetImmersionOfferById(uowPerformer),
      getImmersionOfferBySiretAndRome: new GetImmersionOfferBySiretAndRome(
        uowPerformer,
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
          gateways.addressApi,
          uuidGenerator,
          clock,
        ),
      insertEstablishmentAggregateFromForm:
        new InsertEstablishmentAggregateFromForm(
          uowPerformer,
          gateways.sirene,
          gateways.addressApi,
          uuidGenerator,
          clock,
          createNewEvent,
        ),
      contactEstablishment: new ContactEstablishment(
        uowPerformer,
        createNewEvent,
      ),
      insertDiscussionAggregateFromContactRequest:
        new InsertDiscussionAggregateFromContactRequest(
          uowPerformer,
          clock,
          uuidGenerator,
        ),
      callLaBonneBoiteAndUpdateRepositories:
        new CallLaBonneBoiteAndUpdateRepositories(
          uowPerformer,
          gateways.laBonneBoiteAPI,
          clock,
        ),
      requestEditFormEstablishment: new RequestEditFormEstablishment(
        uowPerformer,
        gateways.email,
        clock,
        makeGenerateEditFormEstablishmentUrl(config),
        createNewEvent,
      ),

      notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm:
        new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
          gateways.passEmploiGateway,
        ),

      // siret
      getSiret,
      getSiretIfNotAlreadySaved: new GetSiretIfNotAlreadySaved(
        uowPerformer,
        gateways.sirene,
      ),

      // romes
      appellationSearch: new AppellationSearch(uowPerformer),
      romeSearch: new RomeSearch(uowPerformer),

      // agencies
      listAgenciesByFilter: new ListAgenciesByFilter(uowPerformer),
      privateListAgencies: new PrivateListAgencies(uowPerformer),
      getAgencyPublicInfoById: new GetAgencyPublicInfoById(uowPerformer),
      sendEmailWhenAgencyIsActivated: new SendEmailWhenAgencyIsActivated(
        gateways.email,
      ),
      // METABASE
      ...dashboardUseCases(gateways.dashboardGateway),
      // notifications
      confirmToSignatoriesThatConventionCorrectlySubmittedRequestSignature:
        new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
          gateways.email,
          generateMagicLinkFn,
        ),
      notifyAllActorsOfFinalConventionValidation:
        new NotifyAllActorsOfFinalConventionValidation(
          uowPerformer,
          gateways.email,
        ),
      notifyNewConventionNeedsReview: new NotifyNewApplicationNeedsReview(
        uowPerformer,
        gateways.email,
        generateMagicLinkFn,
      ),
      notifyToAgencyConventionSubmitted: new NotifyToAgencyApplicationSubmitted(
        uowPerformer,
        gateways.email,
        generateMagicLinkFn,
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
          generateMagicLinkFn,
        ),
      deliverRenewedMagicLink: new DeliverRenewedMagicLink(gateways.email),
      notifyConfirmationEstablishmentCreated:
        new NotifyConfirmationEstablishmentCreated(gateways.email),
      notifyContactRequest: new NotifyContactRequest(
        uowPerformer,
        gateways.email,
      ),
      notifyPoleEmploiUserAdvisorOnAssociation:
        new NotifyPoleEmploiUserAdvisorOnConventionAssociation(
          uowPerformer,
          gateways.email,
          generateMagicLinkFn,
        ),
      notifyPoleEmploiUserAdvisorOnConventionFullySigned:
        new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
          uowPerformer,
          gateways.email,
          generateMagicLinkFn,
        ),
      broadcastToPoleEmploiOnConventionUpdates:
        new BroadcastToPoleEmploiOnConventionUpdates(
          uowPerformer,
          gateways.poleEmploiGateway,
        ),
      shareConventionByEmail: new ShareApplicationLinkByEmail(gateways.email),
      addAgency: new AddAgency(
        uowPerformer,
        createNewEvent,
        config.defaultAdminEmail,
      ),
      updateAgency: new UpdateAgency(uowPerformer, createNewEvent),
      setFeatureFlag: new SetFeatureFlag(uowPerformer),
    }),
    ...instantiatedUseCasesFromFunctions({
      getFeatureFlags: (_: void) =>
        uowPerformer.perform((uow) => uow.featureFlagRepository.getAll()),
      getApiConsumerById: (id: ApiConsumerId) =>
        uowPerformer.perform((uow) => uow.getApiConsumersById(id)),
      getAgencyById: (id: AgencyId) =>
        uowPerformer.perform((uow) => uow.agencyRepository.getById(id)),
      isFormEstablishmentWithSiretAlreadySaved: (siret: SiretDto) =>
        uowPerformer.perform((uow) =>
          uow.establishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
            siret,
          ),
        ),
      getImmersionFacileAgencyIdByKind: (_: void) =>
        uowPerformer.perform((uow) =>
          uow.agencyRepository.getImmersionFacileAgencyId(),
        ),
    }),
  };
};

const dashboardUseCases = (gateway: DashboardGateway) => ({
  dashboardAgency: new AgencyDashboard(gateway),
  dashboardConvention: new ConventionDashboard(gateway),
});

export type UseCases = ReturnType<typeof createUseCases>;

// for type validation
// if this does not compile, make sure all useCase in createUseCases are assignable to InstantiatedUseCase :
const _isAssignable = (
  useCases: UseCases,
): Record<string, InstantiatedUseCase<any, any, any>> => useCases;

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
