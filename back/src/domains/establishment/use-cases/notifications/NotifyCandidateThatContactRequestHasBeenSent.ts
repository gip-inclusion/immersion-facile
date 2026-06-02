import {
  type ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
  errors,
  getFormattedFirstnameAndLastname,
  makeRouteAbsoluteUrl,
  routes,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
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
    config: AppConfig;
  }>()
  .build(
    async ({
      inputParams,
      uow,
      deps: { saveNotificationAndRelatedEvent, config },
    }) => {
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
            beneficiaryDashboardUrl: makeRouteAbsoluteUrl(
              routes.beneficiaryDashboard(),
              config.immersionFacileBaseUrl,
            ),
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
        },
      });
    },
  );
