import subDays from "date-fns/subDays";
import { configureGenerateHtmlFromTemplate } from "html-templates";
import {
  type CommonDiscussionDto,
  type ContactEstablishmentByMailDto,
  type ContactEstablishmentByPhoneDto,
  type ContactEstablishmentInPersonDto,
  type ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
  type DiscussionDto,
  type DiscussionDtoEmail,
  type DiscussionDtoInPerson,
  type DiscussionDtoPhone,
  type ExtraDiscussionDtoProperties,
  emailTemplatesByName,
  errors,
  normalizedMonthInDays,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import type { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { getDiscussionContactsFromAggregate } from "../helpers/businessContact.helpers";
import { makeContactByEmailRequestParams } from "../helpers/contactRequest";

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
      establishment: establishmentAggregate,
      now,
      uow,
    });

    await uow.discussionRepository.insert(discussion);

    await this.#markEstablishmentAsNotSearchableIfLimitReached({
      uow,
      establishmentAggregate,
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
    establishment,
    now,
    uow,
  }: {
    contactRequest: ContactEstablishmentRequestDto;
    establishment: EstablishmentAggregate;
    now: Date;
    uow: UnitOfWork;
  }): Promise<DiscussionDto> {
    const { otherUsers, firstAdminRight, firstAdminUser } =
      await getDiscussionContactsFromAggregate(uow, establishment);

    const matchingAddress = establishment.establishment.locations.find(
      (address) => address.id === contactRequest.locationId,
    );
    if (!matchingAddress)
      throw errors.establishment.missingLocation({
        siret: contactRequest.siret,
        locationId: contactRequest.locationId,
      });

    const common: CommonDiscussionDto = {
      id: this.#uuidGenerator.new(),
      siret: contactRequest.siret,
      businessName:
        establishment.establishment.customizedName ??
        establishment.establishment.name,
      createdAt: now.toISOString(),
      address: matchingAddress.address,
      exchanges: [],
      status: "PENDING",
    };

    const extraDiscussionDtoProperties: ExtraDiscussionDtoProperties = {
      establishmentContact: {
        email: firstAdminUser.email,
        firstName: firstAdminUser.firstName,
        lastName: firstAdminUser.lastName,
        phone: firstAdminRight.phone,
        job: firstAdminRight.job,
        copyEmails: otherUsers.map((user) => user.email),
      },
      appellationCode: contactRequest.appellationCode,
      acquisitionCampaign: contactRequest.acquisitionCampaign,
      acquisitionKeyword: contactRequest.acquisitionKeyword,
    };

    if (contactRequest.contactMode === "EMAIL") {
      return makeDiscussionDtoEmail({
        contactRequest,
        domain: this.#domain,
        common,
        extraDiscussionDtoProperties,
        now,
        uow,
      });
    }

    if (contactRequest.contactMode === "PHONE")
      return makeDiscussionDtoPhone({
        common,
        extraDiscussionDtoProperties,
        contactRequest,
      });

    return makeDiscussionDtoInPerson({
      common,
      extraDiscussionDtoProperties,
      contactRequest,
    });
  }

  async #markEstablishmentAsNotSearchableIfLimitReached({
    uow,
    establishmentAggregate,
    now,
  }: {
    uow: UnitOfWork;
    establishmentAggregate: EstablishmentAggregate;
    now: Date;
  }) {
    if (
      (await this.#wasMaxForMonthReached({
        uow,
        establishment: establishmentAggregate.establishment,
        now,
      })) ||
      (await this.#wasMaxForWeekReached({
        uow,
        establishment: establishmentAggregate.establishment,
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
    establishment,
    now,
  }: {
    uow: UnitOfWork;
    establishment: EstablishmentEntity;
    now: Date;
  }): Promise<boolean> {
    const oneMonthAgo = subDays(now, normalizedMonthInDays);
    const numberOfDiscussionsOfPastMonth =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        establishment.siret,
        oneMonthAgo,
      );

    return establishment.maxContactsPerMonth <= numberOfDiscussionsOfPastMonth;
  }

  async #wasMaxForWeekReached({
    uow,
    establishment,
    now,
  }: {
    uow: UnitOfWork;
    establishment: EstablishmentEntity;
    now: Date;
  }): Promise<boolean> {
    const oneWeekAgo = subDays(now, 7);
    const numberOfDiscussionsOfPastWeek =
      await uow.discussionRepository.countDiscussionsForSiretSince(
        establishment.siret,
        oneWeekAgo,
      );
    const maxContactsPerWeek = Math.ceil(establishment.maxContactsPerMonth / 4);

    return maxContactsPerWeek <= numberOfDiscussionsOfPastWeek;
  }
}

const makeDiscussionDtoEmail = async ({
  common,
  extraDiscussionDtoProperties,
  contactRequest,
  now,
  domain,
  uow,
}: {
  common: CommonDiscussionDto;
  extraDiscussionDtoProperties: ExtraDiscussionDtoProperties;
  contactRequest: ContactEstablishmentByMailDto;
  domain: string;
  uow: UnitOfWork;
  now: Date;
}): Promise<DiscussionDtoEmail> => {
  const discussion: DiscussionDtoEmail = {
    ...common,
    ...extraDiscussionDtoProperties,
    contactMode: contactRequest.contactMode,
    ...(contactRequest.kind === "IF"
      ? {
          kind: contactRequest.kind,
          potentialBeneficiary: {
            firstName: contactRequest.potentialBeneficiaryFirstName,
            lastName: contactRequest.potentialBeneficiaryLastName,
            email: contactRequest.potentialBeneficiaryEmail,
            hasWorkingExperience: contactRequest.hasWorkingExperience,
            experienceAdditionalInformation:
              contactRequest.experienceAdditionalInformation,
            datePreferences: contactRequest.datePreferences,
            phone: contactRequest.potentialBeneficiaryPhone,
            resumeLink: contactRequest.potentialBeneficiaryResumeLink,
            immersionObjective: contactRequest.immersionObjective,
          },
        }
      : {
          kind: contactRequest.kind,
          potentialBeneficiary: {
            firstName: contactRequest.potentialBeneficiaryFirstName,
            lastName: contactRequest.potentialBeneficiaryLastName,
            email: contactRequest.potentialBeneficiaryEmail,
            datePreferences: contactRequest.datePreferences,
            phone: contactRequest.potentialBeneficiaryPhone,
            levelOfEducation: contactRequest.levelOfEducation,
            immersionObjective: contactRequest.immersionObjective,
          },
        }),
  };

  const emailContent = configureGenerateHtmlFromTemplate(emailTemplatesByName, {
    header: undefined,
    footer: undefined,
  })(
    "CONTACT_BY_EMAIL_REQUEST",
    await makeContactByEmailRequestParams({
      uow,
      discussion,
      domain,
    }),
    { showContentParts: true },
  );

  if (!emailContent.contentParts)
    throw errors.email.missingContentParts("CONTACT_BY_EMAIL_REQUEST");

  return {
    ...discussion,
    exchanges: [
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
    ],
  };
};

const makeDiscussionDtoInPerson = ({
  common,
  extraDiscussionDtoProperties,
  contactRequest,
}: {
  common: CommonDiscussionDto;
  extraDiscussionDtoProperties: ExtraDiscussionDtoProperties;
  contactRequest: ContactEstablishmentInPersonDto;
}): DiscussionDtoInPerson => ({
  ...common,
  ...extraDiscussionDtoProperties,
  contactMode: contactRequest.contactMode,
  ...(contactRequest.kind === "IF"
    ? {
        kind: contactRequest.kind,
        potentialBeneficiary: {
          firstName: contactRequest.potentialBeneficiaryFirstName,
          lastName: contactRequest.potentialBeneficiaryLastName,
          email: contactRequest.potentialBeneficiaryEmail,
        },
      }
    : {
        kind: contactRequest.kind,
        potentialBeneficiary: {
          firstName: contactRequest.potentialBeneficiaryFirstName,
          lastName: contactRequest.potentialBeneficiaryLastName,
          email: contactRequest.potentialBeneficiaryEmail,
          levelOfEducation: contactRequest.levelOfEducation,
        },
      }),
});

const makeDiscussionDtoPhone = ({
  common,
  extraDiscussionDtoProperties,
  contactRequest,
}: {
  common: CommonDiscussionDto;
  extraDiscussionDtoProperties: ExtraDiscussionDtoProperties;
  contactRequest: ContactEstablishmentByPhoneDto;
}): DiscussionDtoPhone => ({
  ...common,
  ...extraDiscussionDtoProperties,
  contactMode: contactRequest.contactMode,
  ...(contactRequest.kind === "IF"
    ? {
        kind: contactRequest.kind,
        potentialBeneficiary: {
          firstName: contactRequest.potentialBeneficiaryFirstName,
          lastName: contactRequest.potentialBeneficiaryLastName,
          email: contactRequest.potentialBeneficiaryEmail,
        },
      }
    : {
        kind: contactRequest.kind,
        potentialBeneficiary: {
          firstName: contactRequest.potentialBeneficiaryFirstName,
          lastName: contactRequest.potentialBeneficiaryLastName,
          email: contactRequest.potentialBeneficiaryEmail,
          levelOfEducation: contactRequest.levelOfEducation,
        },
      }),
});
