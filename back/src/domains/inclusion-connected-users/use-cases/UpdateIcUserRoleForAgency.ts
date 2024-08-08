import {
  AgencyRight,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  errors,
  icUserRoleForAgencyParamsSchema,
  replaceElementWhere,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class UpdateIcUserRoleForAgency extends TransactionalUseCase<
  IcUserRoleForAgencyParams,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = icUserRoleForAgencyParamsSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: IcUserRoleForAgencyParams,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const userToUpdate = await uow.userRepository.getById(params.userId);
    if (!userToUpdate) throw errors.user.notFound({ userId: params.userId });

    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const agencyRightToUpdate = userToUpdate.agencyRights.find(
      ({ agency }) => agency.id === params.agencyId,
    );

    if (!agencyRightToUpdate)
      throw errors.user.noRightsOnAgency({
        agencyId: params.agencyId,
        userId: params.userId,
      });

    if (
      agency.counsellorEmails.length === 0 &&
      params.roles.includes("counsellor")
    )
      throw errors.agency.invalidRoleUpdateForOneStepValidationAgency({
        agencyId: params.agencyId,
        role: "counsellor",
      });

    if (!params.roles.includes("validator")) {
      const agencyUsers = await uow.userRepository.getWithFilter({
        agencyId: params.agencyId,
      });

      const agencyHasOtherValidator = agencyUsers.some(
        (agencyUser) =>
          agencyUser.id !== params.userId &&
          agencyUser.agencyRights.some(
            (right) =>
              right.isNotifiedByEmail && right.roles.includes("validator"),
          ),
      );

      if (!agencyHasOtherValidator)
        throw errors.agency.notEnoughValidators({ agencyId: params.agencyId });
    }

    const updatedAgencyRight: AgencyRight = {
      ...agencyRightToUpdate,
      roles: params.roles,
    };

    const newAgencyRights = replaceElementWhere(
      userToUpdate.agencyRights,
      updatedAgencyRight,
      ({ agency }) => agency.id === params.agencyId,
    );

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightChanged",
      payload: {
        ...params,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await Promise.all([
      uow.userRepository.updateAgencyRights({
        userId: params.userId,
        agencyRights: newAgencyRights,
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
