import { GetExportableParams } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryExportGateway } from "../../../adapters/secondary/reporting/InMemoryExportGateway";
import { ExportData } from "../../../domain/backoffice/useCases/ExportData";

describe("ExportDataAsExcel", () => {
  it("Should save data the exported data record", async () => {
    const { useCase, exportGateway, exportQueries } = prepareUseCase();
    const dataToExport = {
      "Auvergne Rhône Alpes": [
        { siret: "124", nom: "une entreprise" },
        { siret: "567", nom: "une autre entreprise" },
        { siret: "890", nom: "encore une entreprise" },
      ],
      "Bourgogne-Franche-Comté": [{}, {}, {}],
    };
    exportQueries.exported = dataToExport;
    const exportableParams: GetExportableParams = {
      name: "establishments_with_aggregated_offers",
      filters: {},
    };
    await useCase.execute({ exportableParams, fileName: "enterprises" });
    expect(exportGateway.savedExportables["enterprises"]).toEqual(dataToExport);
  });
});

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const uowPerformer = new InMemoryUowPerformer(uow);
  const exportGateway = new InMemoryExportGateway();
  const useCase = new ExportData(uowPerformer, exportGateway);

  return {
    useCase,
    exportGateway,
    exportQueries: uow.exportQueries,
  };
};
