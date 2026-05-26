import {
  type AbsoluteUrl,
  type ConventionStatus,
  errors,
  executeInSequence,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

const ConventionStatusesAffectedByBannishment: ConventionStatus[] = [
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
];

export type NotifyConventionBeneficiariesThatEstablishmentIsBanned = ReturnType<
  typeof makeNotifyConventionBeneficiariesThatEstablishmentIsBanned
>;

export const makeNotifyConventionBeneficiariesThatEstablishmentIsBanned =
  useCaseBuilder("NotifyConventionBeneficiariesThatEstablishmentIsBanned")
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

      const conventions = await uow.conventionQueries.getConventions({
        filters: {
          withSirets: [siret],
          withStatuses: ConventionStatusesAffectedByBannishment,
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
