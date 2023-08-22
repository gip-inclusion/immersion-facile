import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppellationCode, SearchImmersionResultDto, SiretDto } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type ImmersionOfferFeedback = SubmitFeedBack<"success">;

type ImmersionOfferState = {
  feedback: ImmersionOfferFeedback;
  currentImmersionOffer: SearchImmersionResultDto | null;
  isLoading: boolean;
};

export type ImmersionOfferPayload =
  | {
      siret: SiretDto;
      appellationCode: AppellationCode;
    }
  | SearchImmersionResultDto;

export const initialState: ImmersionOfferState = {
  currentImmersionOffer: null,
  isLoading: false,
  feedback: {
    kind: "idle",
  },
};

export const immersionOfferSlice = createSlice({
  name: "immersionOffer",
  initialState,
  reducers: {
    fetchImmersionOfferRequested: (
      state,
      _action: PayloadAction<ImmersionOfferPayload>,
    ) => {
      state.isLoading = true;
    },
    fetchImmersionOfferSucceeded: (
      state,
      action: PayloadAction<SearchImmersionResultDto>,
    ) => {
      state.currentImmersionOffer = action.payload;
      state.feedback = {
        kind: "success",
      };
      state.isLoading = false;
    },
    fetchImmersionOfferFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },
  },
});
