import { Slice } from "@reduxjs/toolkit";

type ValueOf<T> = T[keyof T];
export type ActionOfSlice<S extends Slice> = ReturnType<ValueOf<S["actions"]>>;
