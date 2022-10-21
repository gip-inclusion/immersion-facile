import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "shared";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { DiscussionAggregate } from "../entities/DiscussionAggregate";

export class InsertDiscussionAggregateFromContactRequest extends TransactionalUseCase<
  ContactEstablishmentRequestDto,
  void
> {
  inputSchema = contactEstablishmentRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly clock: Clock,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: ContactEstablishmentRequestDto,
    { discussionAggregateRepository }: UnitOfWork,
  ): Promise<void> {
    const createdAt = this.clock.now();
    const discussion: DiscussionAggregate = {
      id: this.uuidGenerator.new(),
      potentialBeneficiaryFirstName: params.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: params.potentialBeneficiaryLastName,
      potentialBeneficiaryEmail: params.potentialBeneficiaryEmail,
      romeCode: params.offer.romeCode,
      siret: params.siret,
      contactMode: params.contactMode,
      createdAt,
      exchanges:
        params.contactMode === "EMAIL"
          ? [
              {
                sentAt: createdAt,
                message: params.message,
                recipient: "establishment",
                sender: "potentialBeneficiary",
              },
            ]
          : [],
    };

    await discussionAggregateRepository.insertDiscussionAggregate(discussion);
  }
}
