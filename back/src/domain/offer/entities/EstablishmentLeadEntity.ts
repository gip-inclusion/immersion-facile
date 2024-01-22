import {
  ConventionId,
  NotificationId,
  NotificationKind,
  SiretDto,
} from "shared";

const establishmentLeadEventKind = [
  "to-be-reminded",
  "reminder-sent",
  "registration-accepted",
  "registration-refused",
] as const;

type EstablishmentLeadEventKind = (typeof establishmentLeadEventKind)[number];

export type EstablishmentLeadEvent =
  | {
      kind: Extract<EstablishmentLeadEventKind, "to-be-reminded">;
      occuredAt: Date;
      conventionId: ConventionId;
    }
  | {
      kind: Extract<EstablishmentLeadEventKind, "reminder-sent">;
      occuredAt: Date;
      notification: { id: NotificationId; kind: NotificationKind };
    }
  | {
      kind: Exclude<
        EstablishmentLeadEventKind,
        "to-be-reminded" | "reminder-sent"
      >;
      occuredAt: Date;
    };

export type EstablishmentLead = {
  siret: SiretDto;
  lastEventKind: EstablishmentLeadEventKind;
  events: EstablishmentLeadEvent[];
};
