import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import SwaggerUI from "swagger-ui-react";
import { Loader, MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { openApiDocSelectors } from "src/core-logic/domain/openApiDoc/openApiDoc.selectors";
import { openApiDocSlice } from "src/core-logic/domain/openApiDoc/openApiDoc.slice";
import "./open-api-doc-page.scss";
import "swagger-ui-react/swagger-ui.css";

export const OpenApiDocPage = (): React.ReactElement => {
  const openApiSpec = useAppSelector(openApiDocSelectors.openApiDoc);
  const dispatch = useDispatch();
  const isLoading = useAppSelector(openApiDocSelectors.isLoading);

  useEffect(() => {
    dispatch(openApiDocSlice.actions.fetchOpenApiDocRequested());
  }, []);

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={0}>
        {isLoading && <Loader />}
        <SwaggerUI spec={openApiSpec} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
