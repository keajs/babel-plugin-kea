const nodePath = require('path')

export default function ({ types: t }) {
  function isKeaCall(node) {
    return (
      t.isIdentifier(node.callee, { name: 'kea' }) &&
      node.arguments.length === 1 &&
      (t.isObjectExpression(node.arguments[0]) || t.isArrayExpression(node.arguments[0]))
    )
  }

  function getLocalPath(state) {
    let root = state.file.opts.root
    if (state.opts.path) {
      root = nodePath.resolve(root, state.opts.path)
    }
    return nodePath.relative(root, state.file.opts.filename)
  }

  const KeaVisitor = {
    CallExpression(path) {
      if (!isKeaCall(path.node)) {
        return
      }
      this.counter += 1
      let pathParts = this.pathParts
      if (this.counter > 1) {
        pathParts = this.pathParts.map((p) => p) // make a copy
        pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1] + '/' + this.counter
      }
      if (t.isObjectExpression(path.node.arguments[0])) {
        if (!path.node.arguments[0].properties.find((property) => t.isIdentifier(property.key, { name: 'path' }))) {
          const pathProperty = t.objectProperty(
            t.identifier('path'),
            t.arrayExpression(pathParts.map((str) => t.stringLiteral(str))),
          )
          path.node.arguments[0].properties = [pathProperty, ...path.node.arguments[0].properties]
        }
      } else if (t.isArrayExpression(path.node.arguments[0])) {
        if (
          !path.node.arguments[0].elements.find(
            (element) => t.isCallExpression(element) && t.isIdentifier(element.callee, { name: 'path' }),
          )
        ) {
          const pathBuilder = t.callExpression(t.identifier('path'), [
            t.arrayExpression(pathParts.map((str) => t.stringLiteral(str))),
          ])
          path.node.arguments[0].elements = [pathBuilder, ...path.node.arguments[0].elements]
        }
      }
    },
  }

  return {
    visitor: {
      Program(path, state) {
        const pathParts = getLocalPath(state)
          .replace(/\.(js|jsx|ts|tsx)$/, '')
          .split(nodePath.sep)

        if (pathParts[0] === '..') {
          return
        }

        path.traverse(KeaVisitor, {
          pathParts: pathParts.map(toCamelCase),
          counter: 0,
        })
      },
    },
  }
}

function toCamelCase(str) {
  // Lower cases the string
  return (
    str
      // Replaces any - or _ characters with a space
      .replace(/[-_]+/g, ' ')
      // Removes any non alphanumeric characters
      .replace(/[^\w\s]/g, '')
      // Uppercases the first character in each group immediately following a space
      // (delimited by spaces)
      .replace(/ (.)/g, function ($1) {
        return $1.toUpperCase()
      })
      // Removes spaces
      .replace(/ /g, '')
  )
}
