import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type HomeEstablishmentState = {
  status: EstablishementCallToAction;
};

const initialState: HomeEstablishmentState = {
  status: "NOTHING",
};

export const homeEstablishmentSlice = createSlice({
  name: "homeEstablishmentSlice",
  initialState,
  reducers: {
    callToActionChanged: (
      state,
      action: PayloadAction<EstablishementCallToAction>,
    ) => ({ ...state, status: action.payload }),
  },
});
