export const useUrlParameters = () =>
  Object.fromEntries(new URLSearchParams(window.location.search).entries());
