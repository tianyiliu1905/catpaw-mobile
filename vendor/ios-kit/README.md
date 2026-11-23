# ios-kit keyboard illustration

Source: https://github.com/kitlangton/ios-kit

Copyright (c) 2026 Kit Langton. MIT license; full text in `LICENSE`.

`keyboard.js` extracts the keyboard illustration, its DOM helper and four icon drawings from upstream `ios-kit.js`. Host lookup is adapted to accept the local keyboard canvas directly, and the API is exposed as `window.CatpawKeyboardIllustration` for buildless use. No glass engine or custom elements are loaded.

`keyboard.css` retains the upstream keyboard rules, scoped under `.demo-keyboard`. Integration styles in `/demo-keyboard.css` scale its original 440 × 344 canvas to the demo's width, and provide the slide transition and dismissal button.

The keyboard is a visual illustration, not an input method. Desktop hardware typing still edits the native textarea; real phones use their system keyboard.
