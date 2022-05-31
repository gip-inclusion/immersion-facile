# Adapters automated integration testing

## Status : 2022/05/31 - REJECTED

## Description

- 2022/05/31 - Adapters MUST have a working implementation of the contract (port) through automated tests executed from one command line on integration environments.

## Context

- 2022/05/31 - Do not test Front > Back Immersion Assessment HTTP gateway success through automated testing since a valid JWT on backend will takes time to prepare

## Decision

- 2022/05/31 - Do not test the adapter instead of make necessary change in order to have a viable integration System Under Test

## Consequences

- 2022/05/31 - Adapters MAY be validated only through manual e2e tests
- 2022/05/31 - Adapters MAY have wrong implementation when external system's API evolve
