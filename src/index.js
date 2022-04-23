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

  /** Format: { 'kea': [[importedName, localNAme], ['path', 'keaPath']] }, */
  const imports = {}
  /** Format: { 'kea': ImportDeclaration } */
  const importDeclarations = {}
  let mustImportPath = false

  const KeaVisitor = {
    // gather all imports
    ImportDeclaration(path) {
      if (t.isStringLiteral(path.node.source)) {
        const importFrom = path.node.source.value
        if (!imports[importFrom]) {
          imports[importFrom] = []
        }
        if (!importDeclarations[importFrom]) {
          importDeclarations[importFrom] = path
        }
        for (const specifier of path.node.specifiers) {
          imports[importFrom].push([specifier.imported.name, specifier.local.name])
        }
      }
    },
    CallExpression(path, state) {
      // only look at kea calls
      if (!isKeaCall(path.node)) {
        return
      }
      // unique path
      this.counter += 1
      let pathParts = this.pathParts
      if (this.counter > 1) {
        pathParts = this.pathParts.map((p) => p) // make a copy
        pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1] + '/' + this.counter
      }
      if (t.isObjectExpression(path.node.arguments[0])) {
        // kea 2.0 object
        if (!path.node.arguments[0].properties.find((property) => t.isIdentifier(property.key, { name: 'path' }))) {
          const pathProperty = t.objectProperty(
            t.identifier('path'),
            t.arrayExpression(pathParts.map((str) => t.stringLiteral(str))),
          )
          path.node.arguments[0].properties = [pathProperty, ...path.node.arguments[0].properties]
        }
      } else if (t.isArrayExpression(path.node.arguments[0])) {
        // kea 3.0 builder
        if (
          !path.node.arguments[0].elements.find(
            (element) => t.isCallExpression(element) && t.isIdentifier(element.callee, { name: 'path' }),
          )
        ) {
          let [, pathImportedAs] = imports['kea']?.find(([importedName]) => importedName === 'path') || []
          if (!pathImportedAs) {
            mustImportPath = true
            pathImportedAs = 'path'
          }
          const pathBuilder = t.callExpression(t.identifier(pathImportedAs), [
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

        if (mustImportPath) {
          // must add path
          if (importDeclarations['kea']) {
            // already imports kea
            importDeclarations['kea'].node.specifiers = [
              ...(importDeclarations['kea'].node.specifiers || []),
              t.importSpecifier(t.identifier('path'), t.identifier('path')),
            ]
          } else {
            path.node.body = [
              ...path.node.body.filter((n) => t.isImportDeclaration(n)),
              t.importDeclaration(
                [t.importSpecifier(t.identifier('path'), t.identifier('path'))],
                t.stringLiteral('kea'),
              ),
              ...path.node.body.filter((n) => !t.isImportDeclaration(n)),
            ]
          }
        }
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
