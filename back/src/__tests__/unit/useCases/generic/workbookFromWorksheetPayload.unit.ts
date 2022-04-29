import { CellValue, Column, Worksheet } from "exceljs";
import { Workbook } from "../../../../domain/generic/excel/port/Workbook";

const isCellDefined = (
  cell: CellValue[] | undefined | null,
): cell is CellValue[] => !!cell;

const expectInsertedWorksheetValuesToStrictEqual = (
  actual: Worksheet,
  expected: any,
): void => {
  const rowValues = actual.getSheetValues() as Array<
    CellValue[] | undefined | null
  >;

  const onlyDefinedRows = rowValues.filter(isCellDefined);

  const onlyDefinedRowsAndValues = onlyDefinedRows.map((row) =>
    row.filter(Boolean),
  );

  expect(onlyDefinedRowsAndValues).toStrictEqual(expected);
};

describe("Excel Generator", (): void => {
  describe("Headers", () => {
    it("should set column header with a human friendly name and ordering", (): void => {
      type DummySimpleMappedType = {
        name: string;
        email: string;
        lastname: string;
      };

      const workbook: Workbook<DummySimpleMappedType> =
        new Workbook<DummySimpleMappedType>()
          .withSheet()
          .withCustomFieldsHeaders([
            { header: "Nom de famille", key: "lastname" },
            { header: "Nom", key: "name" },
          ]);

      expect(workbook.getWorksheet("main").getColumn("lastname")).toMatchObject(
        {
          _header: "Nom de famille",
          _key: "lastname",
        },
      );

      expect(workbook.getWorksheet("main").getColumn("name")).toMatchObject({
        _header: "Nom",
        _key: "name",
      });

      expect(workbook.getWorksheet("main").getRow(0).values).toEqual([]);
    });

    it("should write each given entity as a row of data keeping only mapped keys", () => {
      type DummySimpleMappedType = {
        name: string;
        email: string;
        lastname: string;
      };

      const dummyPayload: DummySimpleMappedType[] = [
        {
          name: "John",
          email: "john.smith@immersion.fr",
          lastname: "Smith",
        },
        {
          name: "Jean",
          email: "jean.doe@immersion.fr",
          lastname: "Doe",
        },
      ];

      const customColumnDefinition: Partial<Column>[] = [
        { header: "Nom de famille", key: "lastname" },
        { header: "Nom", key: "name" },
      ];

      const workbook: Workbook<DummySimpleMappedType> = new Workbook()
        .withSheet()
        .withCustomFieldsHeaders(customColumnDefinition)
        .withPayload(dummyPayload);

      expectInsertedWorksheetValuesToStrictEqual(
        workbook.getWorksheet("main"),
        [
          ["Nom de famille", "Nom"],
          ["Smith", "John"],
          ["Doe", "Jean"],
        ],
      );
    });
  });
});
