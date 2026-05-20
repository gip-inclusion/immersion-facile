import {
  banEstablishmentPayloadSchema,
  type ConnectedUser,
  errors,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type BanEstablishment = ReturnType<typeof makeBanEstablishment>;

export const makeBanEstablishment = useCaseBuilder("BanEstablishment")
  .withInput(banEstablishmentPayloadSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, inputParams, currentUser, deps }) => {
    throwIfNotAdmin(currentUser);

    if (
      await uow.bannedEstablishmentRepository.getBannedEstablishmentBySiret(
        inputParams.siret,
      )
    ) {
      throw errors.bannedEstablishment.alreadyBanned({
        siret: inputParams.siret,
      });
    }

    await uow.bannedEstablishmentRepository.banEstablishment({
      siret: inputParams.siret,
      establishmentBannishmentJustification:
        inputParams.establishmentBannishmentJustification,
    });

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "EstablishmentBanned",
        payload: {
          siret: inputParams.siret,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
        },
      }),
    );
  });
