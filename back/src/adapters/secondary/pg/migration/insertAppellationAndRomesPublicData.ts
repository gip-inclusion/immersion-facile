import fs from "fs";
import { PoolClient } from "pg";
import format from "pg-format";
import { createLogger } from "../../../../utils/logger";

const makeQueryArray = (filePath: string) => {
  const orginialCsv = fs.readFileSync(filePath, "utf-8");
  const rows = orginialCsv.split("\r\n");
  const rowsSliced = rows.slice(1, rows.length - 1);
  return rowsSliced.map((element) => element.split(";"));
};

export const insertRomesPublicData = async (client: PoolClient) => {
  const arrayOfRomeData = makeQueryArray(
    `${__dirname}/../staticData/romes_public.csv`,
  );
  arrayOfRomeData.map((x) => {
    if (x.length == 1) {
      console.log(x);
    }
  });
  await client.query(
    format(
      "INSERT INTO public.romes_public_data (code_rome, libelle_rome) VALUES %L",
      arrayOfRomeData,
    ),
  );
};

export const insertAppellationPublicData = async (client: PoolClient) => {
  const arrayOfAppellationData = makeQueryArray(
    `${__dirname}/../staticData/appellations_public.csv`,
  );

  await client.query(
    format(
      "INSERT INTO public.appellations_public_data (ogr_appellation, code_rome, libelle_appellation_long, libelle_appellation_court) VALUES %L",
      arrayOfAppellationData,
    ),
  );
};

export const addTsVectorData = async (client: PoolClient) => {
  await client.query(
    "UPDATE public.appellations_public_data SET libelle_appellation_long_tsvector = to_tsvector('french', public.appellations_public_data.libelle_appellation_long);",
  );
  await client.query(
    "UPDATE public.romes_public_data SET libelle_rome_tsvector = to_tsvector('french', public.romes_public_data.libelle_rome);",
  );
};
