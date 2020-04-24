const nodePath = require('path')

export default function ({ types: t, template }) {
  function isKeaCall(node) {
    return t.isIdentifier(node.callee, { name: 'kea' }) &&
      node.arguments.length === 1 &&
      t.isObjectExpression(node.arguments[0])
  }

  function buildPathProperty(node, pathParts) {
    const hasKey = node.arguments[0].properties.find(property => t.isIdentifier(property.key, { name: 'key' }))
    const builder = hasKey
      ? template('const a = { path: (key) => ' + (JSON.stringify(pathParts).replace(/\]$/, ', key]')) + ' }')
      : template('const a = { path: () => ' + JSON.stringify(pathParts) + ' }')
    const builtNodes = builder()

    return builtNodes.declarations[0].init.properties[0]
  }

  function getLocalPath (state) {
    let root = state.file.opts.root
    if (state.opts.path) {
      root = nodePath.resolve(root, state.opts.path)
    }
    return nodePath.relative(root, state.file.opts.filename)
  }

  function hasPathProperty (path) {
    return path.node.arguments[0].properties.find(property => t.isIdentifier(property.key, { name: 'path' }))
  }

  const KeaVisitor = {
    CallExpression(path) {
      if (!isKeaCall(path.node) || hasPathProperty(path)) {
        return
      }

      this.counter += 1

      let pathParts = this.pathParts

      if (this.counter > 1) {
        pathParts = this.pathParts.map(p => p) // make a copy
        pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1] + '/' + this.counter
      }

      const pathProperty = buildPathProperty(path.node, pathParts)

      path.node.arguments[0].properties.push(pathProperty)
    }
  }

  return {
    visitor: {
      Program(path, state) {
        const pathParts = getLocalPath(state).replace(/\.(js|jsx|ts|tsx)$/, '').split(nodePath.sep)

        if (pathParts[0] === '..') {
          return
        }

        path.traverse(KeaVisitor, {
          pathParts: pathParts.map(toCamelCase),
          counter: 0
        });
      },
    }
  }
}

function toCamelCase(str) {
  // Lower cases the string
  return str
    // Replaces any - or _ characters with a space
    .replace( /[-_]+/g, ' ')
    // Removes any non alphanumeric characters
    .replace( /[^\w\s]/g, '')
    // Uppercases the first character in each group immediately following a space
    // (delimited by spaces)
    .replace( / (.)/g, function($1) { return $1.toUpperCase(); })
    // Removes spaces
    .replace( / /g, '' );
}
