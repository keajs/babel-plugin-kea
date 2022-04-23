[![NPM Version](https://img.shields.io/npm/v/babel-plugin-kea.svg)](https://www.npmjs.com/package/babel-plugin-kea)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

Note! Version `3.0.0` is designed to work with Kea v3+

# babel-plugin-kea

This plugin helps auto-generate paths for kea logic.

```js
// IN FILE: scenes/homepage/homepageLogic.js

// input:
kea({
  // ... anything but `path`
})

// output:
kea({
  path: ['scenes', 'homepage', 'homepageLogic'],
  // ... anything but `path`
})

// IN FILE: scenes/dashboard/dashboardLogic.js

// input:
kea({
  key: (props) => props.id,
  // ... anything but `path`
})

// output:
kea({
  key: (props) => props.id,
  path: ['scenes', 'homepage', 'homepageLogic'],
  // ... anything but `path`
})

// IN FILE: lib/customPage.js

// input:
kea({
  path: () => ['special', 'customStuff'],
  // other keys
})

// output:
kea({
  path: () => ['special', 'customStuff'], // path was not modified
  // other keys
})

// 3.0.0 logic builders

// input:
import { kea } from 'kea'
kea([])

// output:
import { kea, path } from 'kea'
kea([path(['special', 'customStuff'])])
```

## Installation

First install the package

```bash
# with yarn
yarn add babel-plugin-kea --dev

# with npm
npm install babel-plugin-kea --save-dev
```

Then add it to the list of plugins in your `.babelrc`:

```js
// .babelrc
{
  "plugins": [
    "babel-plugin-kea"
  ]
}
```

## Configuration

Logic paths are scoped from the current path. If you wish to skip a few parts of the path, for example
if your frontend lives under `frontend/src` and you don't want every kea path to start with
`frontend.src`, specify it in the config as follows:

```js
// .babelrc
{
  "plugins": [
    ["babel-plugin-kea", { "path": "./frontend/src" }]
  ]
}
```
