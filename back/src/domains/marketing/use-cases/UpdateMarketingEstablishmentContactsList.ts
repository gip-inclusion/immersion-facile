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

      return establishment
        ? onEstablishment(
            uow,
            establishmentMarketingGateway,
            timeGateway,
            establishment,
            validatedConventionsData,
          )
        : onMissingEstablishment(
            uow,
            timeGateway,
            establishmentMarketingGateway,
            validatedConventionsData,
            siret,
          );
    },
  );

const onMissingEstablishment = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  establishmentMarketingGateway: EstablishmentMarketingGateway,
  validatedConventionsData: ConventionMarketingData[],
  siret: SiretDto,
): Promise<void> => {
  const firstValidatedConvention = validatedConventionsData.at(0);
  const lastValidatedConvention = validatedConventionsData.at(-1);
  if (!lastValidatedConvention) {
    return deleteMarketingContactEntity(
      siret,
      uow,
      establishmentMarketingGateway,
    );
  }

  const marketingContact: MarketingContact = {
    createdAt: timeGateway.now(),
    email: lastValidatedConvention.establishmentRepresentative.email,
    firstName: lastValidatedConvention.establishmentRepresentative.firstName,
    lastName: lastValidatedConvention.establishmentRepresentative.lastName,
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
      validatedConventionsData,
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
  establishmentAggregate: EstablishmentAggregate,
  validatedConventionsData: ConventionMarketingData[],
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

  const firstValidatedConvention = validatedConventionsData.at(0);
  const lastValidatedConvention = validatedConventionsData.at(-1);

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
    conventions: makeConventionInfos(
      validatedConventionsData,
      firstValidatedConvention,
      lastValidatedConvention,
    ),
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

const makeConventionInfos = (
  validatedConventionsData: ConventionMarketingData[],
  firstValidatedConvention: ConventionMarketingData | undefined,
  lastValidatedConvention: ConventionMarketingData | undefined,
): ConventionInfos => ({
  numberOfValidatedConvention: validatedConventionsData.length,
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
