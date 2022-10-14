import React from "react";
import { ManagedErrorKind } from "shared";
import {
  HttpClientInvalidToken,
  HttpClientNotFoundError,
  HttpUnknownClientError,
} from "./HttpClientErrors";
import { PEConnectAdvisorForbiddenAccess } from "./PEConnectAdvisorForbiddenAccess";
import { PEConnectInvalidGrantError } from "./PEConnectInvalidGrantError";
import { PEConnectNoAuthorisation } from "./PEConnectNoAuthorisation";
import { PEConnectNoValidAdvisor } from "./PEConnectNoValidAdvisor";
import { PEConnectNoValidUser } from "./PEConnectNoValidUser";
import { PEConnectUserForbiddenAccess } from "./PEConnectUserForbiddenAccess";
import { UnknownError } from "./UnknownError";

type ManagedErrorSelectorProperties = {
  kind: ManagedErrorKind;
  children?: React.ReactNode;
};

export const ManagedErrorSelector = ({
  kind,
  children,
}: ManagedErrorSelectorProperties) => {
  const ManagedError = managedErrors[kind];
  return <ManagedError>{children}</ManagedError>;
};

type ManagedErrorProperties = {
  children?: React.ReactNode;
};

const managedErrors: Record<
  ManagedErrorKind,
  (props: ManagedErrorProperties) => JSX.Element
> = {
  peConnectNoAuthorisation: PEConnectNoAuthorisation,
  peConnectNoValidAdvisor: PEConnectNoValidAdvisor,
  peConnectNoValidUser: PEConnectNoValidUser,
  peConnectInvalidGrant: PEConnectInvalidGrantError,
  peConnectAdvisorForbiddenAccess: PEConnectAdvisorForbiddenAccess,
  peConnectUserForbiddenAccess: PEConnectUserForbiddenAccess,
  httpUnknownClientError: HttpUnknownClientError,
  httpClientNotFoundError: HttpClientNotFoundError,
  httpClientInvalidToken: HttpClientInvalidToken,
  unknownError: UnknownError,
};
