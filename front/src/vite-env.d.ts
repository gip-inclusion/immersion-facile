/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
export {};

declare global {
  interface Window {
    _mtm: any;
  }
}
