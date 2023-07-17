import React from "react";
// import { useDispatch } from "react-redux";
import SwaggerUI from "swagger-ui-react";
import { openApiDocTargets } from "../../../../../shared/src";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
// import { useAppSelector } from "src/app/hooks/reduxHooks";
// import { openApiDocSelectors } from "src/core-logic/domain/openApiDoc/openApiDoc.selectors";
// import { openApiDocSlice } from "src/core-logic/domain/openApiDoc/openApiDoc.slice";
import "swagger-ui-react/swagger-ui.css";

export const OpenApiDocPage = (): React.ReactElement => (
  // const openApiSpec = useAppSelector(openApiDocSelectors.openApiDoc);
  // const dispatch = useDispatch();
  // const isLoading = useAppSelector(openApiDocSelectors.isLoading);

  // useEffect(() => {
  //   dispatch(openApiDocSlice.actions.fetchOpenApiDocRequested());
  // }, []);

  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={0}>
      {/* {isLoading && <Loader />} */}
      <SwaggerUI url={`/api${openApiDocTargets.getOpenApiDoc.url}`} />
    </MainWrapper>
  </HeaderFooterLayout>
);
