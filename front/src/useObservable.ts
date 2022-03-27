import { useState, useEffect } from "react";
import { Observable } from "rxjs";

export const useObservable = <T>(obs$: Observable<T>, defaultValue: T) => {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    const sub = obs$.subscribe(setState);
    return () => sub.unsubscribe();
  }, [obs$]);

  return state;
};
