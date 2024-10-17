import { equals } from "ramda";
import {
  ConventionDto,
  SiretDto,
  WithSiretDto,
  errors,
  withSiretSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { EstablishmentAggregate } from "../../establishment/entities/EstablishmentEntity";
import { MarketingContact } from "../entities/MarketingContact";
import {
  ConventionInfos,
  EstablishmentMarketingGateway,
  EstablishmentMarketingSearchableBy,
} from "../ports/EstablishmentMarketingGateway";

export type UpdateMarketingEstablishmentContactList = ReturnType<
  typeof makeUpdateMarketingEstablishmentContactList
>;

export const makeUpdateMarketingEstablishmentContactList =
  createTransactionalUseCase<
    WithSiretDto,
    void,
    void,
    {
      establishmentMarketingGateway: EstablishmentMarketingGateway;
      timeGateway: TimeGateway;
    }
  >(
    {
      inputSchema: withSiretSchema,
      name: "UpdateMarketingEstablishmentContactList",
    },
    async ({
      inputParams: { siret },
      deps: { establishmentMarketingGateway, timeGateway },
      uow,
    }): Promise<void> => {
      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );

      const validatedConventions = await uow.conventionQueries.getConventions({
        filters: {
          withSirets: [siret],
          withStatuses: ["ACCEPTED_BY_VALIDATOR"],
        },
        sortBy: "dateValidation",
      });

      return establishment
        ? onEstablishment(
            uow,
            establishmentMarketingGateway,
            timeGateway,
            establishment,
            validatedConventions,
          )
        : onMissingEstablishment(
            uow,
            timeGateway,
            establishmentMarketingGateway,
            validatedConventions,
            siret,
          );
    },
  );

const onMissingEstablishment = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  establishmentMarketingGateway: EstablishmentMarketingGateway,
  validatedConventions: ConventionDto[],
  siret: SiretDto,
): Promise<void> => {
  const firstValidatedConvention = validatedConventions.at(0);
  const lastValidatedConvention = validatedConventions.at(-1);
  if (!lastValidatedConvention) {
    return deleteMarketingContactEntity(
      siret,
      uow,
      establishmentMarketingGateway,
    );
  }

  const marketingContact: MarketingContact = {
    createdAt: timeGateway.now(),
    email:
      lastValidatedConvention.signatories.establishmentRepresentative.email,
    firstName:
      lastValidatedConvention.signatories.establishmentRepresentative.firstName,
    lastName:
      lastValidatedConvention.signatories.establishmentRepresentative.lastName,
  };

  await saveMarketingContactEntity(
    uow,
    lastValidatedConvention.siret,
    marketingContact,
  );

  return establishmentMarketingGateway.save({
    isRegistered: false,
    email: marketingContact.email,
    firstName: marketingContact.firstName,
    lastName: marketingContact.lastName,
    conventions: makeConventionInfos(
      validatedConventions,
      firstValidatedConvention,
      lastValidatedConvention,
    ),
    hasIcAccount: false,
    numberEmployeesRange:
      lastValidatedConvention.establishmentNumberEmployeesRange,
    siret: lastValidatedConvention.siret,
  });
};

const onEstablishment = async (
  uow: UnitOfWork,
  marketingGateway: EstablishmentMarketingGateway,
  timeGateway: TimeGateway,
  establishment: EstablishmentAggregate,
  validatedConventions: ConventionDto[],
): Promise<void> => {
  const firstLocation = establishment.establishment.locations.at(0);
  if (!firstLocation) throw new Error("Establishement has no location.");

  const marketingContact: MarketingContact = {
    createdAt: timeGateway.now(),
    email: establishment.contact.email,
    firstName: establishment.contact.firstName,
    lastName: establishment.contact.lastName,
  };

  await saveMarketingContactEntity(
    uow,
    establishment.establishment.siret,
    marketingContact,
  );
  const provider = await makeProvider(uow);
  const user = await uow.userRepository.findByEmail(
    marketingContact.email,
    provider,
  );

  const hasIcAccount = !!user?.externalId;

  const firstValidatedConvention = validatedConventions.at(0);
  const lastValidatedConvention = validatedConventions.at(-1);

  const discussions = await uow.discussionRepository.getDiscussions({
    filters: { sirets: [establishment.establishment.siret] },
    limit: 500,
  });

  const numberOfDiscussionsAnswered = discussions.filter((discussion) =>
    discussion.exchanges.some(
      (exchange) => exchange.sender === "establishment",
    ),
  ).length;

  return marketingGateway.save({
    email: marketingContact.email,
    firstName: marketingContact.firstName,
    lastName: marketingContact.lastName,
    conventions: makeConventionInfos(
      validatedConventions,
      firstValidatedConvention,
      lastValidatedConvention,
    ),
    departmentCode: firstLocation.address.departmentCode,
    hasIcAccount,
    isRegistered: true,
    maxContactsPerMonth: establishment.establishment.maxContactsPerMonth,
    nafCode: establishment.establishment.nafDto.code,
    numberOfDiscussionsAnswered,
    numberOfDiscussionsReceived: discussions.length,
    searchableBy: makeEstablishmentMarketingSearchableBy(establishment),
    siret: establishment.establishment.siret,
    isCommited: establishment.establishment.isCommited,
    nextAvailabilityDate:
      establishment.establishment.nextAvailabilityDate &&
      new Date(establishment.establishment.nextAvailabilityDate),
    numberEmployeesRange: establishment.establishment.numberEmployeesRange,
    romes: establishment.offers.map(({ romeCode }) => romeCode),
  });
};

const makeConventionInfos = (
  validatedConventions: ConventionDto[],
  firstValidatedConvention: ConventionDto | undefined,
  lastValidatedConvention: ConventionDto | undefined,
): ConventionInfos => ({
  numberOfValidatedConvention: validatedConventions.length,
  ...(firstValidatedConvention?.dateValidation
    ? {
        firstConventionValidationDate: new Date(
          firstValidatedConvention.dateValidation,
        ),
      }
    : {}),
  ...(lastValidatedConvention?.dateValidation
    ? {
        lastConvention: {
          endDate: new Date(lastValidatedConvention.dateEnd),
          validationDate: new Date(lastValidatedConvention.dateValidation),
        },
      }
    : {}),
});

const saveMarketingContactEntity = async (
  uow: UnitOfWork,
  siret: SiretDto,
  marketingContact: MarketingContact,
): Promise<void> => {
  const establishmentMarketingContactEntity =
    await uow.establishmentMarketingRepository.getBySiret(siret);

  const lastMarketingcontact =
    establishmentMarketingContactEntity?.emailContactHistory.at(0);

  if (establishmentMarketingContactEntity && !lastMarketingcontact)
    throw new Error(
      "Marketing contact does not have any contact history. This should not occurs.",
    );

  if (!equals(lastMarketingcontact, marketingContact))
    await uow.establishmentMarketingRepository.save({
      contactEmail: marketingContact.email,
      emailContactHistory: [
        marketingContact,
        ...(establishmentMarketingContactEntity
          ? establishmentMarketingContactEntity.emailContactHistory
          : []),
      ],
      siret,
    });
};

const deleteMarketingContactEntity = async (
  siret: SiretDto,
  uow: UnitOfWork,
  establishmentMarketingGateway: EstablishmentMarketingGateway,
): Promise<void> => {
  const establishmentMarketingContactEntity =
    await uow.establishmentMarketingRepository.getBySiret(siret);
  if (!establishmentMarketingContactEntity)
    throw errors.establishmentMarketing.notFound({ siret });

  await uow.establishmentMarketingRepository.delete(siret);
  await establishmentMarketingGateway.delete(
    establishmentMarketingContactEntity.contactEmail,
  );
};

const makeEstablishmentMarketingSearchableBy = (
  establishment: EstablishmentAggregate,
): EstablishmentMarketingSearchableBy => {
  if (
    establishment.establishment.searchableBy.jobSeekers &&
    establishment.establishment.searchableBy.students
  )
    return "all";

  return establishment.establishment.searchableBy.jobSeekers
    ? "jobSeekers"
    : "students";
};
