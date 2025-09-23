import {
  type ConnectedUser,
  castError,
  type EstablishmentBatchReport,
  executeInSequence,
  formEstablishmentBatchSchema,
  slugify,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { GroupEntity } from "../entities/GroupEntity";
import type { InsertEstablishmentAggregateFromForm } from "./InsertEstablishmentAggregateFromFormEstablishement";

export type AddFormEstablishmentBatch = ReturnType<
  typeof makeAddFormEstablishmentBatch
>;

export const makeAddFormEstablishmentBatch =
  useCaseBuilder<EstablishmentBatchReport>("AddFormEstablishmentBatch")
    .notTransactional()
    .withInput(formEstablishmentBatchSchema)
    .withOutput<EstablishmentBatchReport>()
    .withCurrentUser<ConnectedUser>()
    .withDeps<{
      insertEstablishmentAggregateFromForm: InsertEstablishmentAggregateFromForm;
      uowPerformer: UnitOfWorkPerformer;
    }>()
    .build(
      async ({
        inputParams: { formEstablishments, groupName, description, title },
        currentUser,
        deps: { insertEstablishmentAggregateFromForm, uowPerformer },
      }) => {
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

        await uowPerformer.perform((uow) => uow.groupRepository.save(group));

        const report: EstablishmentBatchReport = {
          numberOfEstablishmentsProcessed: 0,
          numberOfSuccess: 0,
          failures: [],
        };

        await executeInSequence(formEstablishments, async (formEstablishment) =>
          insertEstablishmentAggregateFromForm
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
      },
    );
