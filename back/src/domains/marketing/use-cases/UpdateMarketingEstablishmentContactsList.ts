import { equals } from "ramda";
import {
  errors,
  isSuperEstablishment,
  type SiretDto,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { ConventionMarketingData } from "../../convention/ports/ConventionQueries";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { EstablishmentAggregate } from "../../establishment/entities/EstablishmentAggregate";
import type { MarketingContact } from "../entities/MarketingContact";
import type {
  ConventionInfos,
  EstablishmentMarketingGateway,
  EstablishmentMarketingSearchableBy,
} from "../ports/EstablishmentMarketingGateway";

export type UpdateMarketingEstablishmentContactList = ReturnType<
  typeof makeUpdateMarketingEstablishmentContactList
>;

export const makeUpdateMarketingEstablishmentContactList = useCaseBuilder(
  "UpdateMarketingEstablishmentContactList",
)
  .withInput<WithSiretDto>(withSiretSchema)
  .withOutput<void>()
  .withCurrentUser<void>()
  .withDeps<{
    establishmentMarketingGateway: EstablishmentMarketingGateway;
    timeGateway: TimeGateway;
  }>()
  .build(
    async ({
      inputParams: { siret },
      deps: { establishmentMarketingGateway, timeGateway },
      uow,
    }): Promise<void> => {
      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );

      const validatedConventionsData =
        await uow.conventionQueries.getConventionsMarketingData({
          siret: siret,
        });

      const marketingConventionsData = {
        firstConvention: validatedConventionsData.at(0),
        lastConvention: validatedConventionsData.at(-1),
        totalNumberOfConvention: validatedConventionsData.length,
      };

      return establishment
        ? onEstablishment(
            uow,
            establishmentMarketingGateway,
            timeGateway,
            establishment,
            marketingConventionsData,
          )
        : onMissingEstablishment(
            uow,
            timeGateway,
            establishmentMarketingGateway,
            marketingConventionsData,
            siret,
          );
    },
  );

const onMissingEstablishment = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  establishmentMarketingGateway: EstablishmentMarketingGateway,
  marketingConventionsData: {
    firstConvention: ConventionMarketingData | undefined;
    lastConvention: ConventionMarketingData | undefined;
    totalNumberOfConvention: number;
  },
  siret: SiretDto,
): Promise<void> => {
  const { lastConvention } = marketingConventionsData;

  if (!lastConvention) {
    return deleteMarketingContactEntity(
      siret,
      uow,
      establishmentMarketingGateway,
    );
  }

  const marketingContact: MarketingContact = {
    createdAt: timeGateway.now(),
    email: lastConvention.establishmentRepresentative.email,
    firstName: lastConvention.establishmentRepresentative.firstName,
    lastName: lastConvention.establishmentRepresentative.lastName,
  };

  await saveMarketingContactEntity(uow, lastConvention.siret, marketingContact);

  return establishmentMarketingGateway.save({
    isRegistered: false,
    email: marketingContact.email,
    firstName: marketingContact.firstName,
    lastName: marketingContact.lastName,
    conventions: makeConventionInfos(marketingConventionsData),
    hasIcAccount: false,
    numberEmployeesRange: lastConvention.establishmentNumberEmployeesRange,
    siret: lastConvention.siret,
  });
};

const onEstablishment = async (
  uow: UnitOfWork,
  marketingGateway: EstablishmentMarketingGateway,
  timeGateway: TimeGateway,
  establishmentAggregate: EstablishmentAggregate,
  marketingConventionsData: {
    firstConvention: ConventionMarketingData | undefined;
    lastConvention: ConventionMarketingData | undefined;
    totalNumberOfConvention: number;
  },
): Promise<void> => {
  const firstLocation = establishmentAggregate.establishment.locations.at(0);
  if (!firstLocation) throw new Error("Establishement has no location.");

  const establishmentAdmin = establishmentAggregate.userRights.find((user) =>
    user.role.includes("establishment-admin"),
  );
  if (!establishmentAdmin)
    throw errors.establishment.adminNotFound({
      siret: establishmentAggregate.establishment.siret,
    });

  const userMarketingContact = await uow.userRepository.getById(
    establishmentAdmin.userId,
  );

  if (!userMarketingContact)
    throw errors.user.notFound({ userId: establishmentAdmin.userId });
  const marketingContact: MarketingContact = {
    createdAt: timeGateway.now(),
    email: userMarketingContact.email,
    firstName: userMarketingContact.firstName,
    lastName: userMarketingContact.lastName,
  };

  await saveMarketingContactEntity(
    uow,
    establishmentAggregate.establishment.siret,
    marketingContact,
  );
  const user = await uow.userRepository.findByEmail(marketingContact.email);

  const hasIcAccount = !!user?.proConnect;

  const discussions = await uow.discussionRepository.getDiscussions({
    filters: { sirets: [establishmentAggregate.establishment.siret] },
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
    conventions: makeConventionInfos(marketingConventionsData),
    departmentCode: firstLocation.address.departmentCode,
    hasIcAccount,
    isRegistered: true,
    maxContactsPerMonth:
      establishmentAggregate.establishment.maxContactsPerMonth,
    nafCode: establishmentAggregate.establishment.nafDto.code,
    numberOfDiscussionsAnswered,
    numberOfDiscussionsReceived: discussions.length,
    searchableBy: makeEstablishmentMarketingSearchableBy(
      establishmentAggregate,
    ),
    siret: establishmentAggregate.establishment.siret,
    isCommited: establishmentAggregate.establishment.isCommited,
    nextAvailabilityDate:
      establishmentAggregate.establishment.nextAvailabilityDate &&
      new Date(establishmentAggregate.establishment.nextAvailabilityDate),
    numberEmployeesRange:
      establishmentAggregate.establishment.numberEmployeesRange,
    romes: establishmentAggregate.offers.map(({ romeCode }) => romeCode),
    isSuperEstablishment: isSuperEstablishment(
      establishmentAggregate.establishment.score,
    ),
  });
};

const makeConventionInfos = (marketingConventionsData: {
  firstConvention: ConventionMarketingData | undefined;
  lastConvention: ConventionMarketingData | undefined;
  totalNumberOfConvention: number;
}): ConventionInfos => {
  const { firstConvention, lastConvention, totalNumberOfConvention } =
    marketingConventionsData;

  return {
    numberOfValidatedConvention: totalNumberOfConvention,
    ...(firstConvention?.dateValidation
      ? {
          firstConventionValidationDate: new Date(
            firstConvention.dateValidation,
          ),
        }
      : {}),
    ...(lastConvention?.dateValidation
      ? {
          lastConvention: {
            endDate: new Date(lastConvention.dateEnd),
            validationDate: new Date(lastConvention.dateValidation),
          },
        }
      : {}),
  };
};

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
