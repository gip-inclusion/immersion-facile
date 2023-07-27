import { Action, Slice } from "@reduxjs/toolkit";
import { Epic } from "redux-observable";
import { ValueOf } from "shared";
import { Dependencies } from "src/config/dependencies";
import { RootState } from "src/core-logic/storeConfig/store";

export type ActionOfSlice<S extends Slice> = ReturnType<ValueOf<S["actions"]>>;

export type AppEpic<Input extends Action, Output extends Input = Input> = Epic<
  Input,
  Output,
  RootState,
  Dependencies
>;
