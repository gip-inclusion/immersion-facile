import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const sendSignatureLinkState = ({ sendSignatureLink }: RootState) =>
  sendSignatureLink;

export const sendSignatureLinkSelectors = {
  isSending: createSelector(
    sendSignatureLinkState,
    ({ isSending }) => isSending,
  ),
};
