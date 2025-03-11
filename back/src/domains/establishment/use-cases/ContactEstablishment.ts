import subDays from "date-fns/subDays";
import { configureGenerateHtmlFromTemplate } from "html-templates";
import {
  type BusinessContactDto,
  type ContactEstablishmentRequestDto,
  type DiscussionDto,
  contactEstablishmentRequestSchema,
  emailTemplatesByName,
  errors,
  normalizedMonthInDays,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import type { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { businessContactFromEstablishmentAggregateAndUsers } from "../helpers/businessContact.helpers";

export class ContactEstablishment extends TransactionalUseCase<ContactEstablishmentRequestDto> {
  protected inputSchema = contactEstablishmentRequestSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  readonly #minimumNumberOfDaysBetweenSimilarContactRequests: number;

  readonly #domain: string;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    minimumNumberOfDaysBetweenSimilarContactRequests: number,
    domain: string,
  ) {
    super(uowPerformer);

    this.#uuidGenerator = uuidGenerator;
    this.#timeGateway = timeGateway;
    this.#minimumNumberOfDaysBetweenSimilarContactRequests =
      minimumNumberOfDaysBetweenSimilarContactRequests;
    this.#createNewEvent = createNewEvent;
    this.#domain = domain;
  }

  public async _execute(
    contactRequest: ContactEstablishmentRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const now = this.#timeGateway.now();
    const { siret, contactMode } = contactRequest;

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    if (contactMode !== establishmentAggregate.establishment.contactMethod)
      throw errors.establishment.contactRequestContactModeMismatch({
        siret,
        contactMethods: {
          inParams: contactMode,
          inRepo: establishmentAggregate.establishment.contactMethod,
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
        siret,
        appellationCode: contactRequest.appellationCode,
        minimumNumberOfDaysBetweenSimilarContactRequests:
          this.#minimumNumberOfDaysBetweenSimilarContactRequests,
      });

    const appellationLabel = establishmentAggregate.offers.find(
      (offer) => offer.appellationCode === contactRequest.appellationCode,
    )?.appellationLabel;

    if (!appellationLabel) {
      throw errors.establishment.offerMissing({
        siret,
        appellationCode: contactRequest.appellationCode,
        mode: "bad request",
      });
    }

    const discussion = await this.#createDiscussion({
      contactRequest,
      contact: await businessContactFromEstablishmentAggregateAndUsers(
        uow,
        establishmentAggregate,
      ),
      establishment: establishmentAggregate.establishment,
      now,
      uow,
      domain: this.#domain,
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
          isLegacy: false,
        },
      }),
    );
  }

  async #createDiscussion({
    contactRequest,
    contact,
    establishment,
    now,
    uow,
    domain,
  }: {
    contactRequest: ContactEstablishmentRequestDto;
    contact: BusinessContactDto;
    establishment: EstablishmentEntity;
    now: Date;
    uow: UnitOfWork;
    domain: string;
  }): Promise<DiscussionDto> {
    const matchingAddress = establishment.locations.find(
      (address) => address.id === contactRequest.locationId,
    );
    if (!matchingAddress)
      throw errors.establishment.missingLocation({
        siret: contactRequest.siret,
        locationId: contactRequest.locationId,
      });

    const appellationAndRomeDtos =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [contactRequest.appellationCode],
      );
    const appellationLabel = appellationAndRomeDtos[0]?.appellationLabel;

    if (!appellationLabel)
      throw errors.discussion.missingAppellationLabel({
        appellationCode: contactRequest.appellationCode,
      });

    const discussionId = this.#uuidGenerator.new();

    const emailContent =
      contactRequest.contactMode === "EMAIL"
        ? configureGenerateHtmlFromTemplate(emailTemplatesByName, {
            header: undefined,
            footer: undefined,
          })(
            "CONTACT_BY_EMAIL_REQUEST",
            {
              appellationLabel,
              businessName: establishment.customizedName ?? establishment.name,
              contactFirstName: contact.firstName,
              contactLastName: contact.lastName,
              potentialBeneficiaryFirstName:
                contactRequest.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                contactRequest.potentialBeneficiaryLastName,
              immersionObjective:
                contactRequest.immersionObjective ?? undefined,
              potentialBeneficiaryPhone:
                contactRequest.potentialBeneficiaryPhone,
              potentialBeneficiaryResumeLink:
                contactRequest.potentialBeneficiaryResumeLink,
              businessAddress: `${matchingAddress.address.streetNumberAndAddress} ${matchingAddress.address.postcode} ${matchingAddress.address.city}`,
              replyToEmail: contactRequest.potentialBeneficiaryEmail,
              potentialBeneficiaryDatePreferences:
                contactRequest.datePreferences,
              potentialBeneficiaryExperienceAdditionalInformation:
                contactRequest.experienceAdditionalInformation,
              potentialBeneficiaryHasWorkingExperience:
                contactRequest.hasWorkingExperience,
              domain,
              discussionId: discussionId,
            },
            { showContentParts: true },
          )
        : null;
    return {
      id: discussionId,
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
        ...(contactRequest.contactMode === "EMAIL"
          ? { hasWorkingExperience: contactRequest.hasWorkingExperience }
          : {}),
        ...(contactRequest.contactMode === "EMAIL"
          ? {
              experienceAdditionalInformation:
                contactRequest.experienceAdditionalInformation,
            }
          : {}),
        ...(contactRequest.contactMode === "EMAIL"
          ? {
              datePreferences: contactRequest.datePreferences,
            }
          : {}),
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
        contactRequest.contactMode === "EMAIL" &&
        emailContent &&
        emailContent.contentParts
          ? [
              {
                subject: emailContent.subject,
                sentAt: now.toISOString(),
                message: `${emailContent.contentParts.greetings}
                  ${emailContent.contentParts.content}
                  ${emailContent.contentParts.subContent}`,
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
    contactRequest: ContactEstablishmentRequestDto;
    now: Date;
  }) {
    const maxContactsPerMonth =
      establishmentAggregate.establishment.maxContactsPerMonth;

    const wasMaxForMonthReached = await this.#wasMaxForMonthReached({
      uow,
      siret: contactRequest.siret,
      maxContactsPerMonth: maxContactsPerMonth,
      now,
    });

    if (
      wasMaxForMonthReached ||
      (await this.#wasMaxForWeekReached({
        uow,
        siret: contactRequest.siret,
        maxContactsPerMonth,
        now,
      }))
    ) {
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

  async #wasMaxForMonthReached({
    uow,
    siret,
    maxContactsPerMonth,
    now,
  }: {
    uow: UnitOfWork;
    siret: string;
    maxContactsPerMonth: number;
    now: Date;
  }): Promise<boolean> {
    const oneMonthAgo = subDays(now, normalizedMonthInDays);
    const numberOfDiscussionsOfPastMonth =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        siret,
        oneMonthAgo,
      );
    return maxContactsPerMonth <= numberOfDiscussionsOfPastMonth;
  }

  async #wasMaxForWeekReached({
    uow,
    siret,
    maxContactsPerMonth,
    now,
  }: {
    uow: UnitOfWork;
    siret: string;
    maxContactsPerMonth: number;
    now: Date;
  }): Promise<boolean> {
    const oneWeekAgo = subDays(now, 7);
    const numberOfDiscussionsOfPastWeek =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        siret,
        oneWeekAgo,
      );
    const maxContactsPerWeek = Math.ceil(maxContactsPerMonth / 4);
    return maxContactsPerWeek <= numberOfDiscussionsOfPastWeek;
  }
}
