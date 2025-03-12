import { domElementIds } from "shared";
import { UploadFile } from "src/app/components/UploadFile";

export const UploadFileSection = () => {
  const label = "Télécharger un document sur clever";
  const maxSize_Mo = 10;

  return (
    <>
      <h4>Upload de fichier</h4>
      <UploadFile
        id={domElementIds.addAgency.uploadLogoInput}
        maxSize_Mo={maxSize_Mo}
        label={label}
        shouldDisplayFeedback={true}
      />
    </>
  );
};
