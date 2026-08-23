// Bundle entry for the browser build of the Reactor X2 SDK.
// Uses the package's plain-JS `core` export (not the React `index`), so the bundle carries no
// React peer dependency — our client is vanilla JS. Built by `npm run build:sdk` into
// public/vendor/x2.mjs, which public/index.html imports.
export { X2Model } from '@reactor-models/x2/core';
