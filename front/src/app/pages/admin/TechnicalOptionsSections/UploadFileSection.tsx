import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { domElementIds } from "shared";
import { File } from "react-design-system";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { outOfReduxDependencies } from "src/config/dependencies";

export const UploadFileSection = () => {
  const { onCopyButtonClick, copyButtonLabel, copyButtonIsDisabled } =
    useCopyButton("Copier l'URL du fichier");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [error, setError] = React.useState<string>();
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBase64, setFileBase64] = React.useState<
    string | ArrayBuffer | null
  >(null);
  const renameFileToId = false;
  const label = "Télécharger un document sur clever";
  const maxSize_Mo = 10;
  const onUploadClick = async () => {
    if (!file) return;
    const fileUrl = await outOfReduxDependencies.technicalGateway.uploadFile(
      file,
      renameFileToId,
    );
    setUploadedFileUrl(fileUrl);
  };
  const toBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setFileBase64(reader.result);
    reader.onerror = () => setFileBase64(null);
  };
  return (
    <>
      <h4>Upload de fichier</h4>
      <>
        <File
          onChange={(e) => {
            let tempFile = null;
            if (e.target.files?.length) {
              tempFile = e.target.files[0];
            }
            if (tempFile && tempFile.size > 1_000_000 * maxSize_Mo) {
              setError(`Le fichier ne peut pas faire plus de ${maxSize_Mo} Mo`);
              return;
            } else {
              setError(undefined);
            }
            if (!tempFile) return;

            setFile(tempFile);
            toBase64(tempFile);
          }}
          label={label}
          errorMessage={error}
          id={domElementIds.addAgency.uploadLogoInput}
        />
        {file && file.type.startsWith("image/") && fileBase64 && (
          <div className={fr.cx("fr-col-3")}>
            <figure
              className={fr.cx("fr-content-media", "fr-m-0", "fr-mt-2w")}
              role="group"
              aria-label="Aperçu de l'image"
            >
              <div className={fr.cx("fr-content-media__img")}>
                <img
                  className={fr.cx("fr-responsive-img", "fr-ratio-16x9")}
                  src={String(fileBase64)}
                  alt=""
                />
              </div>
              <figcaption className={fr.cx("fr-content-media__caption")}>
                Aperçu de l'image
              </figcaption>
            </figure>
          </div>
        )}

        <Button
          type="button"
          onClick={onUploadClick}
          className={fr.cx("fr-mt-2w")}
          size="small"
          priority="secondary"
          disabled={!file}
        >
          Téléverser le fichier
        </Button>
      </>
      {uploadedFileUrl && (
        <>
          <Alert
            severity="success"
            title="Fichier uploadé !"
            description={`URL du fichier : ${uploadedFileUrl}`}
            className={fr.cx("fr-mb-2w", "fr-mt-2w")}
          />
          <button
            disabled={copyButtonIsDisabled}
            onClick={() => onCopyButtonClick(uploadedFileUrl)}
            className={fr.cx(
              "fr-btn",
              "fr-btn--sm",
              "fr-icon-clipboard-fill",
              "fr-btn--tertiary-no-outline",
              "fr-btn--icon-left",
              "fr-ml-1w",
            )}
          >
            {copyButtonLabel}
          </button>
        </>
      )}
    </>
  );
};
