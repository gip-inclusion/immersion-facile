import { Loader, MainWrapper } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { frontErrors } from "../error/front-errors";

export const ManageEstablishmentAdminPage = () => {
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

  if (!useAppSelector(authSelectors.isAdminConnected)) {
    throw frontErrors.generic.unauthorized();
  }

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        {connectedUserJwt ? <EstablishmentForm mode="admin" /> : <Loader />}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
