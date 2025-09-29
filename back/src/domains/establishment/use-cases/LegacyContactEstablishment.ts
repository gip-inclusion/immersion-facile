import subDays from "date-fns/subDays";
import {
  type DiscussionDto,
  type Exchange,
  errors,
  type LegacyContactEstablishmentRequestDto,
  legacyContactEstablishmentRequestSchema,
  normalizedMonthInDays,
  type PotentialBeneficiaryCommonProps,
} from "shared";
import { notifyToTeamAndThrowError } from "../../../utils/notifyTeam";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";

export class LegacyContactEstablishment extends TransactionalUseCase<LegacyContactEstablishmentRequestDto> {
  protected inputSchema = legacyContactEstablishmentRequestSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  readonly #minimumNumberOfDaysBetweenSimilarContactRequests: number;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    minimumNumberOfDaysBetweenSimilarContactRequests: number,
  ) {
    super(uowPerformer);

    this.#uuidGenerator = uuidGenerator;
    this.#timeGateway = timeGateway;
    this.#minimumNumberOfDaysBetweenSimilarContactRequests =
      minimumNumberOfDaysBetweenSimilarContactRequests;
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    contactRequest: LegacyContactEstablishmentRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const now = this.#timeGateway.now();
    const { siret, contactMode } = contactRequest;

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    if (contactMode !== establishmentAggregate.establishment.contactMode)
      throw errors.establishment.contactRequestContactModeMismatch({
        siret,
        contactModes: {
          inParams: contactMode,
          inRepo: establishmentAggregate.establishment.contactMode,
        },
      });

    if (
      establishmentAggregate.establishment.nextAvailabilityDate &&
      new Date(establishmentAggregate.establishment.nextAvailabilityDate) >
        this.#timeGateway.now()
    )
      throw errors.establishment.forbiddenUnavailable({ siret });

    const similarDiscussionAlreadyExits =
      await uow.discussionRepository.hasDiscussionMatching({
        siret: contactRequest.siret,
        appellationCode: contactRequest.appellationCode,
        potentialBeneficiaryEmail: contactRequest.potentialBeneficiaryEmail,
        addressId: contactRequest.locationId,
        since: subDays(
          now,
          this.#minimumNumberOfDaysBetweenSimilarContactRequests,
        ),
      });

    if (similarDiscussionAlreadyExits)
      throw errors.establishment.contactRequestConflict({
        appellationCode: contactRequest.appellationCode,
        minimumNumberOfDaysBetweenSimilarContactRequests:
          this.#minimumNumberOfDaysBetweenSimilarContactRequests,
        siret,
      });

    const appellationLabel = establishmentAggregate.offers.find(
      (offer) => offer.appellationCode === contactRequest.appellationCode,
    )?.appellationLabel;

    if (!appellationLabel) {
      notifyToTeamAndThrowError(
        errors.establishment.offerMissing({
          appellationCode: contactRequest.appellationCode,
          siret,
          mode: "bad request",
        }),
      );

      // we keep discord notification for now, but we will remove it when the bug is confirmed and fixed
      // Than it will just be :
      // throw new BadRequestError(
      //   `Establishment with siret '${contactRequest.siret}' doesn't have an immersion offer with appellation code '${contactRequest.appellationCode}'.`,
      // );
    }

    const discussion = await this.#createDiscussion({
      contactRequest,
      establishment: establishmentAggregate,
      now,
    });

    if (
      discussion.contactMode === "EMAIL" &&
      !discussion.potentialBeneficiary.datePreferences
    ) {
      discussion.potentialBeneficiary.datePreferences =
        "Dates d’immersion envisagées non renseignées";
    }

    await uow.discussionRepository.insert(discussion);

    await this.#markEstablishmentAsNotSearchableIfLimitReached({
      uow,
      establishmentAggregate,
      contactRequest,
      now,
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ContactRequestedByBeneficiary",
        payload: {
          siret: discussion.siret,
          discussionId: discussion.id,
          triggeredBy: null,
        },
      }),
    );
  }

  async #createDiscussion({
    contactRequest,
    establishment,
    now,
  }: {
    contactRequest: LegacyContactEstablishmentRequestDto;
    establishment: EstablishmentAggregate;
    now: Date;
  }): Promise<DiscussionDto> {
    const matchingAddress = establishment.establishment.locations.find(
      (address) => address.id === contactRequest.locationId,
    );
    if (!matchingAddress) {
      throw errors.establishment.missingLocation({
        locationId: contactRequest.locationId,
        siret: contactRequest.siret,
      });
    }

    if (
      contactRequest.contactMode !== establishment.establishment.contactMode
    ) {
      throw errors.discussion.badContactMode();
    }

    const potentialBeneficiary: PotentialBeneficiaryCommonProps = {
      firstName: contactRequest.potentialBeneficiaryFirstName,
      lastName: contactRequest.potentialBeneficiaryLastName,
      email: contactRequest.potentialBeneficiaryEmail,
      datePreferences: "",
      phone:
        contactRequest.contactMode === "EMAIL"
          ? contactRequest.potentialBeneficiaryPhone
          : "+33600000000",
    };

    return {
      id: this.#uuidGenerator.new(),
      appellationCode: contactRequest.appellationCode,
      siret: contactRequest.siret,
      businessName:
        establishment.establishment.customizedName ??
        establishment.establishment.name,
      createdAt: now.toISOString(),
      address: matchingAddress.address,
      kind: "IF",
      contactMode: contactRequest.contactMode,
      potentialBeneficiary: {
        ...potentialBeneficiary,
        datePreferences: "",
        ...(contactRequest.contactMode === "EMAIL"
          ? {
              immersionObjective: contactRequest.immersionObjective,
              resumeLink: contactRequest.potentialBeneficiaryResumeLink,
            }
          : {
              immersionObjective: null,
            }),
      },
      exchanges:
        contactRequest.contactMode === "EMAIL"
          ? [
              {
                subject: "Demande de contact initiée par le bénéficiaire",
                sentAt: now.toISOString(),
                message: contactRequest.message,
                sender: "potentialBeneficiary",
                attachments: [],
              } satisfies Exchange,
            ]
          : [],
      acquisitionCampaign: contactRequest.acquisitionCampaign,
      acquisitionKeyword: contactRequest.acquisitionKeyword,
      status: "PENDING",
    };
  }

  async #markEstablishmentAsNotSearchableIfLimitReached({
    uow,
    establishmentAggregate,
    contactRequest,
    now,
  }: {
    uow: UnitOfWork;
    establishmentAggregate: EstablishmentAggregate;
    contactRequest: LegacyContactEstablishmentRequestDto;
    now: Date;
  }) {
    const maxContactsPerWeekForEstablishment =
      establishmentAggregate.establishment.maxContactsPerMonth;

    const numberOfDiscussionsOfPastMonth =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        contactRequest.siret,
        subDays(now, normalizedMonthInDays),
      );

    if (maxContactsPerWeekForEstablishment <= numberOfDiscussionsOfPastMonth) {
      const updatedEstablishment: EstablishmentAggregate = {
        ...establishmentAggregate,
        establishment: {
          ...establishmentAggregate.establishment,
          isMaxDiscussionsForPeriodReached: true,
        },
      };

      await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
        updatedEstablishment,
        now,
      );
    }
  }
}
