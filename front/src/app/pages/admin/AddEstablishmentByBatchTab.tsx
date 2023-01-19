import { map, zipObj } from "ramda";
import React from "react";
import { UploadCsv } from "src/app/components/UploadCsv";

export const AddEstablishmentByBatchTab = () => (
  <div>
    Vous pouvez ajouter des établissements grace à un csv ....
    <br />
    <hr />
    {/*TODO : Faire un input correct*/}
    <input
      placeholder={"Le nom de votre groupement d'entreprise"}
      name="groupe-name"
    />
    <UploadCsv
      label={"Uploader votre CSV"}
      maxSize_Mo={10}
      onUpload={(file) => {
        const reader = new FileReader();
        reader.onload = function () {
          const rawCsvAsString = reader.result as string;
          const objects = convertCsvToObjects(rawCsvAsString);
          // eslint-disable-next-line no-console
          console.log("Parsed objects :");
          // eslint-disable-next-line no-console
          console.log(objects);
        };
        reader.readAsText(file);
      }}
    />
  </div>
);

const convertCsvToObjects = (rawCsv: string) => {
  const [rawHeaders, ...rawData] = rawCsv.split("\n");

  const data = rawData.map((row) => row.split(";"));
  const headers = rawHeaders.split(";");

  return map(zipObj(headers), data);
};
