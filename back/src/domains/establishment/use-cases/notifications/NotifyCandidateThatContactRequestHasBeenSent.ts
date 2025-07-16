import {
  type ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
  errors,
  getFormattedFirstnameAndLastname,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyCandidateThatContactRequestHasBeenSent = ReturnType<
  typeof makeNotifyCandidateThatContactRequestHasBeenSent
>;
export const makeNotifyCandidateThatContactRequestHasBeenSent = useCaseBuilder(
  "NotifyBeneficiaryThatContactRequestHasBeenSent",
)
  .withInput<ContactEstablishmentEventPayload>(
    contactEstablishmentEventPayloadSchema,
  )
  .withOutput<void>()
  .withCurrentUser<void>()
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(
    async ({ inputParams, uow, deps: { saveNotificationAndRelatedEvent } }) => {
      const discussion = await uow.discussionRepository.getById(
        inputParams.discussionId,
      );

      if (!discussion)
        throw errors.discussion.notFound({
          discussionId: inputParams.discussionId,
        });

      if (discussion.contactMode !== "EMAIL") return;

      await saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "CONTACT_BY_EMAIL_CANDIDATE_CONFIRMATION",
          recipients: [discussion.potentialBeneficiary.email],
          params: {
            kind: discussion.kind,
            businessName: discussion.businessName,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: discussion.potentialBeneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: discussion.potentialBeneficiary.lastName,
            }),
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
        },
      });
    },
  );
