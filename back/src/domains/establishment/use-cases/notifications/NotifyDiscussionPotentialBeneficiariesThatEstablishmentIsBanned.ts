import {
  type AbsoluteUrl,
  errors,
  executeInSequence,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned =
  ReturnType<
    typeof makeNotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned
  >;

export const makeNotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned =
  useCaseBuilder(
    "NotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned",
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

      const discussions = await uow.discussionRepository.getDiscussions({
        filters: { sirets: [siret] },
        limit: 1000,
      });

      const pendingDiscussion = discussions.filter(
        (d) => d.status === "PENDING",
      );

      await executeInSequence(pendingDiscussion, (discussion) =>
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
    });
