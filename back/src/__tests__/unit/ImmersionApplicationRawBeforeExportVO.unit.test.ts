import { expectToEqual } from "../../../../shared/src/expectToEqual";
import {
  PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE,
  PROD_PG_0_HOUR_EXEMPLE,
} from "../../adapters/secondary/StubImmersionApplicationExportQueries";

describe("ImmersionApplicationRawBeforeExportVO", () => {
  describe("BUG - with production data that have total hours to 0 on excel reports (usecase has tech coupling)", () => {
    it("exclude business logic - return 140 before making excel part - withPartialProdData", () => {
      expectToEqual(
        PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE.toImmersionApplicationReadyForExportVO()
          .totalHours,
        140,
      );
    });

    it("exclude business logic - return 140 before making excel part - withFullProdData", () => {
      expectToEqual(
        PROD_PG_0_HOUR_EXEMPLE.toImmersionApplicationReadyForExportVO()
          .totalHours,
        140,
      );
    });
  });
});
