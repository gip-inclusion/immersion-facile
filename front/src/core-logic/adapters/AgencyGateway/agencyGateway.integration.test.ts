import { firstValueFrom, Observable } from "rxjs";
import { AgencyId } from "shared";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/AgencyGateway/InMemoryAgencyGateway";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const adapters: AgencyGateway[] = [new InMemoryAgencyGateway()];

describe("Agency Gateway - integration tests", () => {
  adapters.forEach((adapter: AgencyGateway) => {
    describe(`immersionFacileAgency ${adapter.constructor.name}`, () => {
      it("retreive the id as observable from the gateway", async () => {
        const immersionId$: Observable<AgencyId | undefined> =
          adapter.getImmersionFacileAgencyId$();

        const immersionId = await firstValueFrom<AgencyId | undefined>(
          immersionId$,
        );
        expect(immersionId).toBe("agency-id-with-immersion-facile-kind");
      });
    });
  });
});
