import subDays from "date-fns/subDays";
import {
  DiscussionDto,
  LegacyContactEstablishmentRequestDto,
  errors,
  legacyContactEstablishmentRequestSchema,
  normalizedMonthInDays,
} from "shared";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { ContactEntity } from "../entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";

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

    if (contactMode !== establishmentAggregate.contact.contactMethod)
      throw errors.establishment.contactRequestContactModeMismatch({
        siret,
        contactMethods: {
          inParams: contactMode,
          inRepo: establishmentAggregate.contact.contactMethod,
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
      notifyAndThrowErrorDiscord(
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

    const discussion = this.#createDiscussion({
      contactRequest,
      contact: establishmentAggregate.contact,
      establishment: establishmentAggregate.establishment,
      now,
    });

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

  #createDiscussion({
    contactRequest,
    contact,
    establishment,
    now,
  }: {
    contactRequest: LegacyContactEstablishmentRequestDto;
    contact: ContactEntity;
    establishment: EstablishmentEntity;
    now: Date;
  }): DiscussionDto {
    const matchingAddress = establishment.locations.find(
      (address) => address.id === contactRequest.locationId,
    );
    if (!matchingAddress) {
      throw errors.establishment.missingLocation({
        locationId: contactRequest.locationId,
        siret: contactRequest.siret,
      });
    }
    return {
      id: this.#uuidGenerator.new(),
      appellationCode: contactRequest.appellationCode,
      siret: contactRequest.siret,
      businessName: establishment.customizedName ?? establishment.name,
      createdAt: now.toISOString(),
      immersionObjective:
        contactRequest.contactMode === "EMAIL"
          ? contactRequest.immersionObjective
          : null,
      address: matchingAddress.address,
      potentialBeneficiary: {
        firstName: contactRequest.potentialBeneficiaryFirstName,
        lastName: contactRequest.potentialBeneficiaryLastName,
        email: contactRequest.potentialBeneficiaryEmail,
        phone:
          contactRequest.contactMode === "EMAIL"
            ? contactRequest.potentialBeneficiaryPhone
            : undefined,
        resumeLink:
          contactRequest.contactMode === "EMAIL"
            ? contactRequest.potentialBeneficiaryResumeLink
            : undefined,
      },
      establishmentContact: {
        contactMethod: contactRequest.contactMode,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        job: contact.job,
        copyEmails: contact.copyEmails,
      },
      exchanges:
        contactRequest.contactMode === "EMAIL"
          ? [
              {
                subject: "Demande de contact initiée par le bénéficiaire",
                sentAt: now.toISOString(),
                message: contactRequest.message,
                recipient: "establishment",
                sender: "potentialBeneficiary",
                attachments: [],
              },
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
      const updatedEstablishment = {
        ...establishmentAggregate,
        establishment: {
          ...establishmentAggregate.establishment,
          isSearchable: false,
        },
      };

      await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
        updatedEstablishment,
        now,
      );
    }
  }
}
