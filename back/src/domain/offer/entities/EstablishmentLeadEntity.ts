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

type EstablishmentLeadEvent = {
  occuredAt: Date;
  kind: EstablishmentLeadEventKind;
  conventionId: ConventionId;
  notification?: { id: NotificationId; kind: NotificationKind };
};

export type EstablishmentLead = {
  siret: SiretDto;
  lastEventKind: EstablishmentLeadEventKind;
  events: EstablishmentLeadEvent[];
};
