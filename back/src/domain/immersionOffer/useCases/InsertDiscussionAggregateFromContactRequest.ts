import subDays from "date-fns/subDays";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { DiscussionAggregate } from "../entities/DiscussionAggregate";

export class InsertDiscussionAggregateFromContactRequest extends TransactionalUseCase<ContactEstablishmentRequestDto> {
  inputSchema = contactEstablishmentRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly timeGateway: TimeGateway,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: ContactEstablishmentRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const now = this.timeGateway.now();
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        params.siret,
      );
    if (!establishmentAggregate)
      throw new NotFoundError(
        `No establishment found with siret n°${params.siret}`,
      );

    const establishmentContact = establishmentAggregate.contact;
    if (!establishmentContact)
      throw new NotFoundError(
        `No contact found for establishment with siret n°${params.siret}`,
      );

    const discussion: DiscussionAggregate = {
      id: this.uuidGenerator.new(),
      appellationCode: params.appellationCode,
      siret: params.siret,
      createdAt: now,
      immersionObjective:
        params.contactMode === "EMAIL" ? params.immersionObjective : null,
      address: establishmentAggregate.establishment.address,
      potentialBeneficiary: {
        firstName: params.potentialBeneficiaryFirstName,
        lastName: params.potentialBeneficiaryLastName,
        email: params.potentialBeneficiaryEmail,
        phone:
          params.contactMode === "EMAIL"
            ? params.potentialBeneficiaryPhone
            : "",
        resumeLink:
          params.contactMode === "EMAIL"
            ? params.potentialBeneficiaryResumeLink
            : "",
      },
      establishmentContact: {
        contactMode: params.contactMode,
        email: establishmentContact.email,
        firstName: establishmentContact.firstName,
        lastName: establishmentContact.lastName,
        phone: establishmentContact.phone,
        job: establishmentContact.job,
        copyEmails: establishmentContact.copyEmails,
      },
      exchanges:
        params.contactMode === "EMAIL"
          ? [
              {
                sentAt: now,
                message: params.message,
                recipient: "establishment",
                sender: "potentialBeneficiary",
              },
            ]
          : [],
    };

    await uow.discussionAggregateRepository.insert(discussion);

    const maxContactsPerWeekForEstablishment =
      establishmentAggregate.establishment.maxContactsPerWeek;

    const numberOfDiscussionsOfPast7Days =
      await uow.discussionAggregateRepository.countDiscussionsForSiretSince(
        params.siret,
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
