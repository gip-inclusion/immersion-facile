import {
  type AgencyWithUsersRights,
  type ConventionDto,
  errors,
  frontRoutes,
  type Signatory,
  type TemplatedEmail,
  withConventionSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyLastSigneeThatConventionHasBeenSigned = ReturnType<
  typeof makeNotifyLastSigneeThatConventionHasBeenSigned
>;

type Deps = {
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  timeGateway: TimeGateway;
};

export const makeNotifyLastSigneeThatConventionHasBeenSigned = useCaseBuilder(
  "NotifyLastSigneeThatConventionHasBeenSigned",
)
  .withInput(withConventionSchema)
  .withDeps<Deps>()
  .build(async ({ inputParams: { convention }, uow, deps }) => {
    const savedConvention = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!savedConvention)
      throw errors.convention.notFound({ conventionId: convention.id });

    const agency = await uow.agencyRepository.getById(savedConvention.agencyId);

    if (!agency)
      throw errors.agency.notFound({
        agencyId: savedConvention.agencyId,
      });

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: makeEmail(savedConvention, agency, deps),
      followedIds: {
        conventionId: savedConvention.id,
        agencyId: savedConvention.agencyId,
        establishmentSiret: savedConvention.siret,
      },
    });
  });

type Signee = Omit<Signatory, "signedAt"> & {
  signedAt: string;
};

const getLastSignee = (signatories: Signatory[]): Signee | undefined =>
  signatories
    .filter(
      (
        signatory,
      ): signatory is Signatory & {
        signedAt: string;
      } => signatory.signedAt !== undefined,
    )
    .sort((a, b) => (a.signedAt < b.signedAt ? -1 : 0))
    .at(-1);

const makeEmail = (
  convention: ConventionDto,
  agency: AgencyWithUsersRights,
  deps: Deps,
): TemplatedEmail => {
  const lastSignee: Signee | undefined = getLastSignee(
    Object.values(convention.signatories),
  );

  if (lastSignee)
    return {
      kind: "SIGNEE_HAS_SIGNED_CONVENTION",
      params: {
        agencyLogoUrl: agency.logoUrl ?? undefined,
        internshipKind: convention.internshipKind,
        conventionId: convention.id,
        signedAt: lastSignee.signedAt,
        magicLink: deps.generateConventionMagicLinkUrl({
          targetRoute: frontRoutes.manageConvention,
          id: convention.id,
          role: lastSignee.role,
          email: lastSignee.email,
          now: deps.timeGateway.now(),
          lifetime: "1Month",
        }),
        agencyName: agency.name,
      },
      recipients: [lastSignee.email],
    };

  throw errors.convention.noSignatoryHasSigned({
    conventionId: convention.id,
  });
};
