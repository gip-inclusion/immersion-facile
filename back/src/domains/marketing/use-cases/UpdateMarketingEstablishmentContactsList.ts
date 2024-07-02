import { Location, SiretDto, siretSchema } from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { ContactEntity } from "../../establishment/entities/ContactEntity";
import { EstablishmentAggregate } from "../../establishment/entities/EstablishmentEntity";
import { MarketingContact } from "../entities/MarketingContact";
import { MarketingGateway } from "../ports/MarketingGateway";

export type UpdateMarketingEstablishmentContactList = ReturnType<
  typeof makeUpdateMarketingEstablishmentContactList
>;

export const makeUpdateMarketingEstablishmentContactList =
  createTransactionalUseCase<
    SiretDto,
    void,
    undefined,
    {
      marketingGateway: MarketingGateway;
      timeGateway: TimeGateway;
    }
  >(
    {
      inputSchema: siretSchema,
      name: "UpdateMarketingEstablishmentContactList",
    },
    async (params, { deps, uow }, _userEntity): Promise<void> => {
      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          params,
        );

      if (!establishment)
        throw new Error("Don't know what to do on missing establishement.");

      const contact = establishment.contact;

      if (!contact) throw new Error("Missing contact in establishement");

      const firstLocation = establishment.establishment.locations.at(0);
      if (!firstLocation) throw new Error("Establishement has no location.");

      const marketingContact: MarketingContact = {
        createdAt: deps.timeGateway.now(),
        email: contact.email,
        name: contact.firstName,
        surname: contact.lastName,
      };

      const marketingEstablishmentContactInRepo =
        await uow.establishmentMarketingRepository.getBySiret(
          establishment.establishment.siret,
        );
      if (!marketingEstablishmentContactInRepo) {
        addmarketekingEstablishmentContact(
          uow,
          marketingContact,
          establishment,
          firstLocation,
          deps,
          contact,
        );
      }
    },
  );

const addmarketekingEstablishmentContact = async (
  uow: UnitOfWork,
  marketingContact: MarketingContact,
  establishment: EstablishmentAggregate,
  firstLocation: Location,
  deps: {
    marketingGateway: MarketingGateway;
    timeGateway: TimeGateway;
  },
  contact: ContactEntity,
) => {
  await uow.establishmentMarketingRepository.save({
    contactEmail: contact.email,
    emailContactHistory: [marketingContact],
    siret: establishment.establishment.siret,
  });

  await deps.marketingGateway.save({
    contact: marketingContact,
    conventions: {
      numberOfConventions: 0,
    },
    departmentCode: firstLocation.address.departmentCode,
    hasIcAccount: false,
    isRegistered: true,
    maxContactsPerWeek: establishment.establishment.maxContactsPerWeek,
    nafCode: establishment.establishment.nafDto.code,
    numberOfDiscussionsAnswered: 0,
    numberOfDiscussionsReceived: 0,
    searchableBy: "all",
    siret: establishment.establishment.siret,
    isCommited: establishment.establishment.isCommited,
    nextAvailabilityDate: establishment.establishment.nextAvailabilityDate,
    numberEmployeesRange: establishment.establishment.numberEmployeesRange,
  });
};
