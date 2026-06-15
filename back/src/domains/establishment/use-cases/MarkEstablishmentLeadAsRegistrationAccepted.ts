import { withSiretSchema } from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type MarkEstablishmentLeadAsRegistrationAccepted = ReturnType<
  typeof makeMarkEstablishmentLeadAsRegistrationAccepted
>;

export const makeMarkEstablishmentLeadAsRegistrationAccepted = useCaseBuilder(
  "MarkEstablishmentLeadAsRegistrationAccepted",
)
  .withInput(withSiretSchema)
  .withDeps<{
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams: { siret }, uow, deps: { timeGateway } }) => {
    const alreadyExistingLead =
      await uow.establishmentLeadRepository.getBySiret(siret);

    if (alreadyExistingLead)
      await uow.establishmentLeadRepository.save({
        siret,
        lastEventKind: "registration-accepted",
        events: [
          ...alreadyExistingLead.events,
          {
            occurredAt: timeGateway.now(),
            kind: "registration-accepted",
          },
        ],
      });
  });
