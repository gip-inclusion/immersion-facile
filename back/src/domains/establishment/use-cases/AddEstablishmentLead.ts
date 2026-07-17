import { errors, withConventionSchema } from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export type AddEstablishmentLead = ReturnType<typeof makeAddEstablishmentLead>;

export const makeAddEstablishmentLead = useCaseBuilder("AddEstablishmentLead")
  .withInput(withConventionSchema)
  .withDeps<{ timeGateway: TimeGateway }>()
  .build(async ({ inputParams: { convention }, uow, deps }) => {
    if (convention.status !== "ACCEPTED_BY_VALIDATOR")
      throw errors.convention.notValidated({ convention });

    const alreadyExistingLead =
      await uow.establishmentLeadRepository.getBySiret(convention.siret);

    const existingEstablishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        convention.siret,
      );

    if (alreadyExistingLead || existingEstablishment) return;

    const establishmentLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "to-be-reminded",
      events: [
        {
          conventionId: convention.id,
          occurredAt: deps.timeGateway.now(),
          kind: "to-be-reminded",
        },
      ],
    };
    await uow.establishmentLeadRepository.save(establishmentLead);
  });
