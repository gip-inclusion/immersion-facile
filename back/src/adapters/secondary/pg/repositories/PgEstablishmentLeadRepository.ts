import { match, P } from "ts-pattern";
import { SiretDto } from "shared";
import {
  EstablishmentLead,
  EstablishmentLeadEvent,
} from "../../../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadRepository } from "../../../../domain/offer/ports/EstablishmentLeadRepository";
import { KyselyDb } from "../kysely/kyselyUtils";

export class PgEstablishmentLeadRepository
  implements EstablishmentLeadRepository
{
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  public async getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentLead | undefined> {
    const leadEvents = await this.#transaction
      .selectFrom("establishment_lead_events")
      .selectAll()
      .where("siret", "=", siret)
      .orderBy("occurred_at asc")
      .execute();

    if (leadEvents.length === 0) return;

    return leadEvents.reduce((acc, event) => {
      const eventToAdd: EstablishmentLeadEvent = match(event)
        .with(
          { kind: "to-be-reminded", convention_id: P.not(P.nullish) },
          ({ kind, convention_id, occurred_at }) => ({
            kind,
            occuredAt: occurred_at,
            conventionId: convention_id,
          }),
        )
        .with(
          {
            kind: "reminder-sent",
            notification_id: P.not(P.nullish),
            notification_kind: P.not(P.nullish),
          },
          ({ kind, notification_kind, notification_id, occurred_at }) => ({
            kind,
            occuredAt: occurred_at,
            notification: { id: notification_id, kind: notification_kind },
          }),
        )
        .with(
          { kind: P.union("registration-accepted", "registration-refused") },
          ({ kind, occurred_at }) => ({
            kind,
            occuredAt: occurred_at,
          }),
        )
        .otherwise(() => {
          throw new Error("should not happen");
        });

      const newLead: EstablishmentLead = {
        siret: event.siret,
        lastEventKind: event.kind,
        events: [...(acc?.events ?? []), eventToAdd],
      };
      return newLead;
    }, {} as EstablishmentLead);
  }

  public async save(establishmentLead: EstablishmentLead): Promise<void> {
    await this.#transaction
      .deleteFrom("establishment_lead_events")
      .where("siret", "=", establishmentLead.siret)
      .execute();

    await this.#transaction
      .insertInto("establishment_lead_events")
      .values(
        establishmentLead.events.map((event) =>
          mapEventToEstablishmentLead(establishmentLead.siret, event),
        ),
      )
      .execute();
  }
}

const mapEventToEstablishmentLead = (
  siret: SiretDto,
  event: EstablishmentLeadEvent,
) =>
  match(event)
    .with({ kind: "to-be-reminded" }, ({ kind, occuredAt, conventionId }) => ({
      siret,
      kind,
      occurred_at: occuredAt,
      convention_id: conventionId,
    }))
    .with({ kind: "reminder-sent" }, ({ kind, occuredAt, notification }) => ({
      siret,
      kind,
      occurred_at: occuredAt,
      notification_id: notification.id,
      notification_kind: notification.kind,
    }))
    .otherwise(({ kind, occuredAt }) => ({
      siret,
      kind,
      occurred_at: occuredAt,
    }));
