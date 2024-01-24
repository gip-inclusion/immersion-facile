import React, { useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { UploadFile } from "src/app/components/UploadFile";

export const UploadFileSection = () => {
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  return (
    <>
      <h4>Upload de fichier</h4>
      <UploadFile
        setFileUrl={setUploadedFileUrl}
        renameFileToId={false}
        label={"Télécharger un document sur clever"}
        maxSize_Mo={10}
      />
      {uploadedFileUrl && (
        <Alert
          severity="success"
          title="Fichier uploadé !"
          description={`URL du fichier : ${uploadedFileUrl}`}
          className={"fr-mb-2w"}
        />
      )}
    </>
  );
};
