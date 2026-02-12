import {
  type AbsoluteUrl,
  type ConventionDraftDto,
  errors,
  frontRoutes,
  shareConventionDraftByEmailFromConventionSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { makeShortLink } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { ConventionDraftRepository } from "../ports/ConventionDraftRepository";

const throwConflictErrorWhenConventionDraftHasBeenUpdatedSinceLastSave =
  async ({
    conventionDraftRepository,
    conventionDraftUpdated,
  }: {
    conventionDraftRepository: ConventionDraftRepository;
    conventionDraftUpdated: ConventionDraftDto;
  }) => {
    const existingConventionDraft = await conventionDraftRepository.getById(
      conventionDraftUpdated.id,
    );

    if (
      existingConventionDraft?.updatedAt &&
      conventionDraftUpdated.updatedAt &&
      existingConventionDraft.updatedAt > conventionDraftUpdated.updatedAt
    ) {
      throw errors.conventionDraft.conflict({
        conventionDraftId: conventionDraftUpdated.id,
      });
    }
  };

export type ShareConventionDraftByEmail = ReturnType<
  typeof makeShareConventionDraftByEmail
>;

export const makeShareConventionDraftByEmail = useCaseBuilder(
  "ShareConventionDraftByEmail",
)
  .withInput(shareConventionDraftByEmailFromConventionSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    timeGateway: TimeGateway;
    config: AppConfig;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const now = deps.timeGateway.now().toISOString();

    await throwConflictErrorWhenConventionDraftHasBeenUpdatedSinceLastSave({
      conventionDraftRepository: uow.conventionDraftRepository,
      conventionDraftUpdated: inputParams.conventionDraft,
    });

    await uow.conventionDraftRepository.save(inputParams.conventionDraft, now);

    const shortLink = await makeShortLink({
      uow,
      longLink:
        `${deps.config.immersionFacileBaseUrl}/${inputParams.conventionDraft.internshipKind === "immersion" ? frontRoutes.conventionImmersionRoute : frontRoutes.conventionMiniStageRoute}?conventionDraftId=${inputParams.conventionDraft.id}` as AbsoluteUrl,
      shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
      config: deps.config,
    });

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "SHARE_CONVENTION_DRAFT_SELF",
        recipients: [inputParams.senderEmail],
        params: {
          conventionFormUrl: shortLink,
          internshipKind: inputParams.conventionDraft.internshipKind,
        },
      },
      followedIds: {},
    });

    if (inputParams.recipientEmail) {
      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "SHARE_CONVENTION_DRAFT_RECIPIENT",
          recipients: [inputParams.recipientEmail],
          params: {
            additionalDetails: inputParams.details,
            conventionFormUrl: shortLink,
            internshipKind: inputParams.conventionDraft.internshipKind,
          },
        },
        followedIds: {},
      });
    }
  });
