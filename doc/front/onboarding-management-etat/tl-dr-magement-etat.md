# Un exemple complet TL;DR epics, slice, store, selector

## Epic

```typescript
const getAgenciesUseCase = (
  action$: Observable<AgencyAction>,
  _state$: Observable<RootState>,
  dependencies: Dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgenciesRequested.match),
    switchMap((action: PayloadAction<string>) =>
      dependencies.agencyGateway.listAgencies$(action.payload),
    ),
    map(agenciesSlice.actions.fetchAgenciesSucceeded),
  );

export const agenciesEpics = [getAgenciesUseCase];
```

On peut également utiliser les types construits exprès pour l'application (pour plus de simplicité) :

```typescript
const getAgenciesUseCase: AppEpic<AgencyAction> = (action$, state$, dependencies) => {...}
```

## Slice

```typescript
export type AgencyState = AgencyIdAndName[];

const initialState: AgencyState = [];

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesRequested: (state, _action: PayloadAction<string>) => state,
    fetchAgenciesSucceeded: (
      _state,
      action: PayloadAction<AgencyIdAndName[]>,
    ) => action.payload,
  },
});
```

## Selecteur

```typescript
export const agenciesSelector = ({ agencies }: RootState) => agencies;
```

## Rappel des 2 declarations à rajouter dans le [store](front/src/core-logic/storeConfig/store.ts) lors d'une création

```typescript
const allEpics: any[] = [
  [...],
  ...agenciesEpics,
];

const rootReducer = combineReducers({
  [...],
  [agenciesSlice.name]: agenciesSlice.reducer,
});
```
