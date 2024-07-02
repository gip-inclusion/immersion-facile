import { SiretDto, siretSchema } from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
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

      if (!establishment.contact)
        throw new Error("Missing contact in establishement");

      const firstLocation = establishment.establishment.locations.at(0);
      if (!firstLocation) throw new Error("Establishement has no location.");

      const marketingContact: MarketingContact = {
        createdAt: deps.timeGateway.now(),
        email: establishment.contact.email,
        name: establishment.contact.firstName,
        surname: establishment.contact.lastName,
      };

      await uow.establishmentMarketingRepository.save({
        contactEmail: establishment.contact.email,
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
    },
  );
