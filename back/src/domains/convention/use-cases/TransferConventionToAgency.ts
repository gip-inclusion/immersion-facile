import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type TransferConventionToAgencyRequestDto,
  type UserId,
  errors,
  transferConventionToAgencyRequestSchema,
} from "shared";
import { throwErrorIfAgencyNotFound } from "../../../utils/agency";
import type { AgencyRepository } from "../../agency/ports/AgencyRepository";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwErrorOnConventionIdMismatch,
  throwIfNotAllowedForUser,
} from "../entities/Convention";

export type TransferConventionToAgency = ReturnType<
  typeof makeTransferConventionToAgency
>;

export const makeTransferConventionToAgency = createTransactionalUseCase<
  TransferConventionToAgencyRequestDto,
  void,
  ConventionRelatedJwtPayload,
  {
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  }
>(
  {
    name: "TransferConventionToAgency",
    inputSchema: transferConventionToAgencyRequestSchema,
  },
  async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status, [
      "IN_REVIEW",
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
    ]);

    await throwErrorIfUserIsValidatorOfAgencyWithRefersTo({
      agencyId: convention.agencyId,
      agencyRepository: uow.agencyRepository,
    });

    await throwErrorIfAgencyNotFound({
      agencyId: inputParams.agencyId,
      agencyRepository: uow.agencyRepository,
    });

    await throwIfNotAllowedForUser({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
      convention,
    });

    const triggeredBy: TriggeredBy =
      "userId" in jwtPayload
        ? {
            kind: "inclusion-connected",
            userId: jwtPayload.userId,
          }
        : {
            kind: "convention-magic-link",
            role: jwtPayload.role,
          };

    const updatedConvention: ConventionDto = {
      ...convention,
      agencyId: inputParams.agencyId,
    };

    await Promise.all([
      uow.conventionRepository.update(updatedConvention),
      sendEmailsToSignatories({
        userId: "userId" in jwtPayload ? jwtPayload.userId : undefined,
        convention,
        uow,
        deps,
        jwtPayload,
      }),
    ]);
  },
);

const throwErrorIfConventionStatusNotAllowed = (
  status: ConventionStatus,
  allowedStatuses: ConventionStatus[],
) => {
  if (!allowedStatuses.includes(status)) {
    throw errors.convention.transferNotAllowedForStatus({
      status: status,
    });
  }
};

const throwErrorIfUserIsValidatorOfAgencyWithRefersTo = async ({
  agencyId,
  agencyRepository,
}: { agencyId: string; agencyRepository: AgencyRepository }) => {
  const agency = await agencyRepository.getById(agencyId);
  if (agency?.refersToAgencyId) {
    throw errors.convention.unsupportedRole({ role: "validator" });
  }
};

const sendEmailsToSignatories = async ({
  userId,
  convention,
  uow,
  deps,
  jwtPayload,
}: {
  userId: UserId | undefined;
  convention: ConventionDto;
  uow: UnitOfWork;
  deps: {
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  };
  jwtPayload: ConventionRelatedJwtPayload;
}) => {
  // const shortLink = await deps.shortLinkIdGeneratorGateway.generateShortLinkId(
  //   convention.id,
  // );

  convention.signatories.map((signatory) => {
    deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
        userId,
      },
      templatedContent: {

        recipientEmail: jwtPayload.email,
        kind: "LastReminderForSignatories",
        params: { shortLink: shortLink },
      },
    });
  });
};
