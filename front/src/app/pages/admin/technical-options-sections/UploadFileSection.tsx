import { fr } from "@codegouvfr/react-dsfr";
import { domElementIds } from "shared";
import { UploadFile } from "src/app/components/UploadFile";
import { BackofficeDashboardTabContent } from "src/app/components/layout/BackofficeDashboardTabContent";

export const UploadFileSection = () => {
  const label = "Télécharger un document sur clever";
  const maxSize_Mo = 10;

  return (
    <BackofficeDashboardTabContent
      title="Upload de fichier"
      className={fr.cx("fr-mt-4w")}
    >
      <UploadFile
        id={domElementIds.addAgency.uploadLogoInput}
        maxSize_Mo={maxSize_Mo}
        label={label}
        shouldDisplayFeedback={true}
      />
    </BackofficeDashboardTabContent>
  );
};
