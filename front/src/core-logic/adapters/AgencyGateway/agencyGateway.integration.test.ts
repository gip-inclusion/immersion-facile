import { firstValueFrom, Observable } from "rxjs";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/AgencyGateway/InMemoryAgencyGateway";
import { AgencyId } from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const adapters: AgencyGateway[] = [
  new InMemoryAgencyGateway(),
  // TODO Propose default configuration to target local / docker backend when running integration tests
  // front/jest.config.js =>  testEnvironment: "node" => "jsdom" ? ref: https://stackoverflow.com/questions/51957139/jest-tests-run-in-bash-but-generate-referenceerror-xmlhttprequest-is-not-defin
  //new HttpAgencyGateway()
  // option to override HttpGateways (hostname / http https) => target another fqdn
];

describe("Agency Gateway - integration tests", () => {
  adapters.forEach((adapter: AgencyGateway) => {
    describe(`immersionFacileAgency ${adapter.constructor.name}`, () => {
      it("retreive the id as observable from the gateway", async () => {
        const immersionId$: Observable<AgencyId | false> =
          adapter.getImmersionFacileAgencyId$();

        const immersionId = await firstValueFrom<AgencyId | false>(
          immersionId$,
        );
        expect(immersionId).toBe("agency-id-with-immersion-facile-kind");
      });
    });
  });
});
