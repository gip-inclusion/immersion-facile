import { domElementIds } from "shared";
import { UploadFile } from "src/app/components/UploadFile";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

export const UploadFileSection = () => {
  const connectedUserJwt = useAppSelector(authSelectors.inclusionConnectToken);
  const label = "Télécharger un document sur clever";
  const maxSize_Mo = 10;

  if (!connectedUserJwt) return null;

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
