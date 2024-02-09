import {
  ConventionId,
  ExcludeFromExisting,
  ExtractFromExisting,
  NotificationId,
  NotificationKind,
  SiretDto,
} from "shared";

export const establishmentLeadEventKind = [
  "to-be-reminded",
  "reminder-sent",
  "registration-accepted",
  "registration-refused",
] as const;

export type EstablishmentLeadEventKind =
  (typeof establishmentLeadEventKind)[number];

export type EstablishmentLeadEvent =
  | {
      kind: ExtractFromExisting<EstablishmentLeadEventKind, "to-be-reminded">;
      occurredAt: Date;
      conventionId: ConventionId;
    }
  | {
      kind: ExtractFromExisting<EstablishmentLeadEventKind, "reminder-sent">;
      occurredAt: Date;
      notification: { id: NotificationId; kind: NotificationKind };
    }
  | {
      kind: ExcludeFromExisting<
        EstablishmentLeadEventKind,
        "to-be-reminded" | "reminder-sent"
      >;
      occurredAt: Date;
    };

export type EstablishmentLead = {
  siret: SiretDto;
  lastEventKind: EstablishmentLeadEventKind;
  events: EstablishmentLeadEvent[];
};

export const isSiretsListFilled = (
  sirets: SiretDto[],
): sirets is [SiretDto, ...SiretDto[]] => sirets.length > 0;
