import type { Action, Slice } from "@reduxjs/toolkit";
import type { Epic } from "redux-observable";
import type { ValueOf } from "shared";
import type { Dependencies } from "src/config/dependencies";
import type { RootState } from "src/core-logic/storeConfig/store";

export type ActionOfSlice<S extends Slice> = ReturnType<ValueOf<S["actions"]>>;

export type AppEpic<Input extends Action, Output extends Input = Input> = Epic<
  Input,
  Output,
  RootState,
  Dependencies
>;
