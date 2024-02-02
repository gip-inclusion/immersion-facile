import React from "react";
import { MainWrapper } from "react-design-system";
import { technicalRoutes } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export const OpenApiDocPage = (): React.ReactElement => (
  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={0}>
      <SwaggerUI
        url={`/api${technicalRoutes.openApiSpec.url}`}
        supportedSubmitMethods={["get"]}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
