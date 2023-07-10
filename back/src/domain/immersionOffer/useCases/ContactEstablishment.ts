import subDays from "date-fns/subDays";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "shared";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { ContactEntity } from "../entities/ContactEntity";
import { DiscussionAggregate } from "../entities/DiscussionAggregate";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";

export class ContactEstablishment extends TransactionalUseCase<ContactEstablishmentRequestDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = contactEstablishmentRequestSchema;

  public async _execute(
    contactRequest: ContactEstablishmentRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const now = this.timeGateway.now();
    const { siret, contactMode } = contactRequest;

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw new NotFoundError(siret);

    const establishmentContact = establishmentAggregate.contact;
    if (!establishmentContact)
      throw new NotFoundError(
        `No contact found for establishment with siret: ${siret}`,
      );

    if (contactMode !== establishmentContact.contactMethod)
      throw new BadRequestError(
        `Contact mode mismatch: ${contactMode} in params. In contact (fetched with siret) : ${establishmentContact.contactMethod}`,
      );

    const appellationLabel = establishmentAggregate.immersionOffers.find(
      (offer) => offer.appellationCode === contactRequest.appellationCode,
    )?.appellationLabel;

    if (!appellationLabel) {
      notifyAndThrowErrorDiscord(
        new BadRequestError(
          `Establishment with siret '${contactRequest.siret}' doesn't have an immersion offer with appellation code '${contactRequest.appellationCode}'.`,
        ),
      );

      // we keep discord notification for now, but we will remove it when the bug is confirmed and fixed
      // Than it will just be :
      // throw new BadRequestError(
      //   `Establishment with siret '${contactRequest.siret}' doesn't have an immersion offer with appellation code '${contactRequest.appellationCode}'.`,
      // );
    }

    const discussion = this.createDiscussion({
      contactRequest,
      contact: establishmentContact,
      establishment: establishmentAggregate.establishment,
      now,
    });

    await uow.discussionAggregateRepository.insert(discussion);

    await this.markEstablishmentAsNotSearchableIfLimitReached({
      uow,
      establishmentAggregate,
      contactRequest,
      now,
    });

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "ContactRequestedByBeneficiary",
        payload: { ...contactRequest, discussionId: discussion.id },
      }),
    );
  }

  private createDiscussion({
    contactRequest,
    contact,
    establishment,
    now,
  }: {
    contactRequest: ContactEstablishmentRequestDto;
    contact: ContactEntity;
    establishment: EstablishmentEntity;
    now: Date;
  }): DiscussionAggregate {
    return {
      id: this.uuidGenerator.new(),
      appellationCode: contactRequest.appellationCode,
      siret: contactRequest.siret,
      businessName: establishment.customizedName ?? establishment.name,
      createdAt: now,
      immersionObjective:
        contactRequest.contactMode === "EMAIL"
          ? contactRequest.immersionObjective
          : null,
      address: establishment.address,
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
                sentAt: now,
                message: contactRequest.message,
                recipient: "establishment",
                sender: "potentialBeneficiary",
              },
            ]
          : [],
    };
  }

  private async markEstablishmentAsNotSearchableIfLimitReached({
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
    const maxContactsPerWeekForEstablishment =
      establishmentAggregate.establishment.maxContactsPerWeek;

    const numberOfDiscussionsOfPast7Days =
      await uow.discussionAggregateRepository.countDiscussionsForSiretSince(
        contactRequest.siret,
        subDays(now, 7),
      );

    if (maxContactsPerWeekForEstablishment <= numberOfDiscussionsOfPast7Days) {
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
