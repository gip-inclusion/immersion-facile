import React from "react";
import SwaggerUI from "swagger-ui-react";
import { technicalRoutes } from "shared";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
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
