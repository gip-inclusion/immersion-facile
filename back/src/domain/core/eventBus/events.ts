type GenericEvent<T extends string, P> = Readonly<{
  id: string;
  occuredAt: string;
  topic: T;
  payload: P;
  // wasPublished: boolean;
}>;

export type DomainEvent =
  | GenericEvent<
      "ImmersionApplicationSubmittedByBeneficiary",
      { submittedByBeneficiary: string }
    >
  | GenericEvent<
      "ImmersionApplicationSubmittedByHostingCompany",
      { submittedByHostingCompany: number }
    >
  | GenericEvent<"DemandeImmersionCancelled", { canceled: Date }>;

export type DomainTopic = DomainEvent["topic"];
