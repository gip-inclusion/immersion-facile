import {
  type AbsoluteUrl,
  type ConventionStatus,
  errors,
  executeInSequence,
  onlyAdminUserRightsWithStatusAccepted,
  onlyContactUserRightsWithStatusAccepted,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

const conventionStatusesAffectedByBannishment: ConventionStatus[] = [
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
];

export type NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned =
  ReturnType<
    typeof makeNotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned
  >;

export const makeNotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned =
  useCaseBuilder(
    "NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned",
  )
    .withInput<WithSiretDto>(withSiretSchema)
    .withDeps<{
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      immersionBaseUrl: AbsoluteUrl;
    }>()
    .build(async ({ uow, inputParams, deps }) => {
      const { siret } = inputParams;

      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );

      if (!establishment) throw errors.establishment.notFound({ siret });
      if (!establishment.establishment.isEstablishmentBanned)
        throw errors.establishment.establishmentNotBanned({ siret });

      const userRightIds = establishment.userRights
        .filter(
          (right) =>
            onlyAdminUserRightsWithStatusAccepted(right) ||
            onlyContactUserRightsWithStatusAccepted(right),
        )
        .map((right) => right.userId);

      const users = await uow.userRepository.getByIds(userRightIds);

      await executeInSequence(users, (user) =>
        deps.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [user.email],
            params: { businessName: establishment.establishment.name, siret },
          },
          followedIds: { establishmentSiret: siret },
        }),
      );

      const discussions = await uow.discussionRepository.getDiscussions({
        filters: { sirets: [siret] },
        limit: 1000,
      });

      const pendingDiscussions = discussions.filter(
        (d) => d.status === "PENDING",
      );

      await executeInSequence(pendingDiscussions, (discussion) =>
        deps.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [discussion.potentialBeneficiary.email],
            params: {
              businessName: establishment.establishment.name,
              beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
              beneficiaryLastName: discussion.potentialBeneficiary.lastName,
              immersionBaseUrl: deps.immersionBaseUrl,
            },
          },
          followedIds: { establishmentSiret: siret },
        }),
      );

      const conventions = await uow.conventionQueries.getConventions({
        filters: {
          withSirets: [siret],
          withStatuses: conventionStatusesAffectedByBannishment,
        },
        sortBy: "dateStart",
      });

      await executeInSequence(conventions, (convention) =>
        deps.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [convention.signatories.beneficiary.email],
            params: {
              businessName: establishment.establishment.name,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              immersionBaseUrl: deps.immersionBaseUrl,
            },
          },
          followedIds: {
            establishmentSiret: siret,
            conventionId: convention.id,
          },
        }),
      );
    });
