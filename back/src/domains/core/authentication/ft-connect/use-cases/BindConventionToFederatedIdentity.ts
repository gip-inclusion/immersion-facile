import {
  authFailed,
  type ConventionDto,
  type FtConnectIdentity,
  withConventionSchema,
} from "shared";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../useCaseBuilder";

export type BindConventionToFederatedIdentity = ReturnType<
  typeof makeBindConventionToFederatedIdentity
>;

export const makeBindConventionToFederatedIdentity = useCaseBuilder(
  "BindConventionToFederatedIdentity",
)
  .withInput(withConventionSchema)
  .withDeps<{ createNewEvent: CreateNewEvent }>()
  .build(
    async ({ inputParams: { convention }, uow, deps: { createNewEvent } }) => {
      const federatedIdentity =
        convention.signatories.beneficiary.federatedIdentity;

      return federatedIdentity &&
        federatedIdentity.provider === "peConnect" &&
        federatedIdentity.token !== authFailed
        ? associateConventionToFederatedIdentity({
            convention,
            federatedIdentity,
            uow,
            createNewEvent,
          })
        : uow.outboxRepository.save(
            createNewEvent({
              topic: "FederatedIdentityNotBoundToConvention",
              payload: { convention, triggeredBy: null },
            }),
          );
    },
  );

const associateConventionToFederatedIdentity = async ({
  convention,
  federatedIdentity,
  uow,
  createNewEvent,
}: {
  convention: ConventionDto;
  federatedIdentity: FtConnectIdentity;
  uow: UnitOfWork;
  createNewEvent: CreateNewEvent;
}): Promise<void> =>
  uow.conventionFranceTravailAdvisorRepository
    .associateConventionAndUserAdvisor(convention.id, federatedIdentity.token)
    .then(() =>
      uow.outboxRepository.save(
        createNewEvent({
          topic: "FederatedIdentityBoundToConvention",
          payload: { convention, triggeredBy: null },
        }),
      ),
    )
    .catch((_) =>
      uow.outboxRepository.save(
        createNewEvent({
          topic: "FederatedIdentityNotBoundToConvention",
          payload: { convention, triggeredBy: null },
        }),
      ),
    );
