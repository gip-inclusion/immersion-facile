import subDays from "date-fns/subDays";
import { configureGenerateHtmlFromTemplate } from "html-templates";
import {
  BusinessContactDto,
  ContactEstablishmentRequestDto,
  DiscussionDto,
  contactEstablishmentRequestSchema,
  emailTemplatesByName,
  errors,
  normalizedMonthInDays,
} from "shared";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
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
      notifyAndThrowErrorDiscord(
        errors.establishment.offerMissing({
          siret,
          appellationCode: contactRequest.appellationCode,
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
      contact: await businessContactFromEstablishmentAggregateAndUsers(
        uow,
        await makeProvider(uow),
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
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        contactRequest.appellationCode,
      ]);
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
    const maxContactsPerMonthForEstablishment =
      establishmentAggregate.establishment.maxContactsPerMonth;

    const numberOfDiscussionsOfPastMonth =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        contactRequest.siret,
        subDays(now, normalizedMonthInDays),
      );

    if (maxContactsPerMonthForEstablishment <= numberOfDiscussionsOfPastMonth) {
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
