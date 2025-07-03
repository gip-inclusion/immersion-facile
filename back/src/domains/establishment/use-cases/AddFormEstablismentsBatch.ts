import {
  type ConnectedUser,
  castError,
  type EstablishmentBatchReport,
  executeInSequence,
  type FormEstablishmentBatchDto,
  formEstablishmentBatchSchema,
  slugify,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import { UseCase } from "../../core/UseCase";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { GroupEntity } from "../entities/GroupEntity";
import type { InsertEstablishmentAggregateFromForm } from "./InsertEstablishmentAggregateFromFormEstablishement";

export class AddFormEstablishmentBatch extends UseCase<
  FormEstablishmentBatchDto,
  EstablishmentBatchReport,
  ConnectedUser
> {
  protected inputSchema = formEstablishmentBatchSchema;

  constructor(
    private insertEstablishmentAggregateFromForm: InsertEstablishmentAggregateFromForm,
    private uowPerformer: UnitOfWorkPerformer,
  ) {
    super();
  }

  protected async _execute(
    {
      formEstablishments,
      groupName,
      description,
      title,
    }: FormEstablishmentBatchDto,
    currentUser: ConnectedUser,
  ): Promise<EstablishmentBatchReport> {
    throwIfNotAdmin(currentUser);
    const group: GroupEntity = {
      slug: slugify(groupName),
      name: groupName,
      sirets: formEstablishments.map(({ siret }) => siret),
      options: {
        heroHeader: {
          title,
          description,
        },
      },
    };
    await this.uowPerformer.perform((uow) => uow.groupRepository.save(group));

    const report: EstablishmentBatchReport = {
      numberOfEstablishmentsProcessed: 0,
      numberOfSuccess: 0,
      failures: [],
    };

    await executeInSequence(formEstablishments, async (formEstablishment) =>
      this.insertEstablishmentAggregateFromForm
        .execute(
          {
            formEstablishment,
          },
          currentUser,
        )
        .then(() => {
          report.numberOfSuccess += 1;
        })
        .catch((error) => {
          report.failures.push({
            siret: formEstablishment.siret,
            errorMessage: castError(error).message,
          });
        })
        .finally(() => {
          report.numberOfEstablishmentsProcessed += 1;
        }),
    );

    return report;
  }
}
