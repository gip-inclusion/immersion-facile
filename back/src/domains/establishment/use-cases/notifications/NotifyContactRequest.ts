import { ascend, prop, sort } from "ramda";
import {
  addressDtoToString,
  type ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
  createOpaqueEmail,
  type DiscussionDtoEmail,
  type DiscussionDtoInPerson,
  type DiscussionDtoPhone,
  type Email,
  errors,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  type TemplatedEmail,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { EstablishmentAggregate } from "../../entities/EstablishmentAggregate";
import { getNotifiedUsersFromEstablishmentUserRights } from "../../helpers/businessContact.helpers";
import { makeContactByEmailRequestParams } from "../../helpers/contactRequest";

export class NotifyContactRequest extends TransactionalUseCase<ContactEstablishmentEventPayload> {
  protected inputSchema = contactEstablishmentEventPayloadSchema;

  readonly #replyDomain: string;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #immersionFacileBaseUrl: AppConfig["immersionFacileBaseUrl"];

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
    immersionFacileBaseUrl: AppConfig["immersionFacileBaseUrl"],
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    payload: ContactEstablishmentEventPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const discussion = await uow.discussionRepository.getById(
      payload.discussionId,
    );
    if (!discussion)
      throw errors.discussion.notFound({ discussionId: payload.discussionId });

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );

    if (!establishment)
      throw errors.establishment.notFound({ siret: discussion.siret });

    return discussion.contactMode === "EMAIL"
      ? this.#notifyOnEmailContactMode({
          uow,
          discussion,
          establishment,
          isLegacy: payload.isLegacy,
        })
      : this.#notifyOnOtherContactMode({ uow, discussion, establishment });
  }

  async #notifyOnEmailContactMode({
    uow,
    discussion,
    establishment,
    isLegacy,
  }: {
    uow: UnitOfWork;
    discussion: DiscussionDtoEmail;
    establishment: EstablishmentAggregate;
    isLegacy: boolean | undefined;
  }): Promise<void> {
    const appellations =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [discussion.appellationCode],
      );
    const appellation = appellations.at(0);
    if (!appellation)
      throw errors.rome.missingAppellation({
        appellationCode: discussion.appellationCode,
      });

    const opaqueEmail: Email = createOpaqueEmail({
      discussionId: discussion.id,
      recipient: {
        kind: "potentialBeneficiary",
        firstname: discussion.potentialBeneficiary.firstName,
        lastname: discussion.potentialBeneficiary.lastName,
      },
      replyDomain: this.#replyDomain,
    });

    const notifiedRecipients = (
      await getNotifiedUsersFromEstablishmentUserRights(
        uow,
        establishment.userRights,
      )
    ).map((user) => user.email);

    const templatedContent: TemplatedEmail = {
      sender: immersionFacileNoReplyEmailSender,
      recipients: notifiedRecipients,
      replyTo: {
        email: opaqueEmail,
        name: `${getFormattedFirstnameAndLastname({ firstname: discussion.potentialBeneficiary.firstName, lastname: discussion.potentialBeneficiary.lastName })} - via Immersion Facilitée`,
      },
      kind: "CONTACT_BY_EMAIL_REQUEST",
      params: {
        ...(await makeContactByEmailRequestParams({
          appellation,
          discussion,
          immersionFacileBaseUrl: this.#immersionFacileBaseUrl,
        })),
        replyToEmail: opaqueEmail,
      },
    };

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: isLegacy
        ? {
            ...templatedContent,
            kind: "CONTACT_BY_EMAIL_REQUEST_LEGACY",
            params: {
              ...templatedContent.params,
              message: sort(ascend(prop("sentAt")), discussion.exchanges)[0]
                .message,
            },
          }
        : templatedContent,
      followedIds: { establishmentSiret: discussion.siret },
    });
  }

  async #notifyOnOtherContactMode({
    uow,
    discussion,
    establishment,
  }: {
    uow: UnitOfWork;
    discussion: DiscussionDtoInPerson | DiscussionDtoPhone;
    establishment: EstablishmentAggregate;
  }) {
    const firstAdminRight = establishment.userRights.find(
      (right) => right.role === "establishment-admin",
    );
    if (!firstAdminRight)
      throw errors.establishment.adminNotFound({
        siret: establishment.establishment.siret,
      });

    const firstAdminUser = await uow.userRepository.getById(
      firstAdminRight.userId,
    );
    if (!firstAdminUser)
      throw errors.user.notFound({ userId: firstAdminRight.userId });

    const common = {
      businessName: discussion.businessName,
      contactFirstName: getFormattedFirstnameAndLastname({
        firstname: firstAdminUser.firstName,
      }),
      contactLastName: getFormattedFirstnameAndLastname({
        lastname: firstAdminUser.lastName,
      }),
      kind: discussion.kind,
      potentialBeneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: discussion.potentialBeneficiary.firstName,
      }),
      potentialBeneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: discussion.potentialBeneficiary.lastName,
      }),
    };

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        sender: immersionFacileNoReplyEmailSender,
        recipients: [discussion.potentialBeneficiary.email],
        ...(discussion.contactMode === "IN_PERSON"
          ? {
              kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
              params: {
                ...common,
                businessAddress: addressDtoToString(discussion.address),
              },
            }
          : {
              kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
              params: {
                ...common,
                contactPhone: firstAdminRight.phone,
              },
            }),
      },
      followedIds: { establishmentSiret: discussion.siret },
    });
  }
}
