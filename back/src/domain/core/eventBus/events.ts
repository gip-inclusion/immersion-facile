import type { DemandeImmersionDto } from "../../../shared/DemandeImmersionDto";
import type { DateStr } from "../ports/Clock";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  wasPublished?: boolean;
};

export type DomainEvent =
  | GenericEvent<
      "ImmersionApplicationSubmittedByBeneficiary",
      DemandeImmersionDto
    >
  | GenericEvent<
      "FinalImmersionApplicationValidationByAdmin",
      DemandeImmersionDto
    >;

export type DomainTopic = DomainEvent["topic"];
