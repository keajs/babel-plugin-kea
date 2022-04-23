/* global test, describe, expect */
import { transform } from '@babel/core'
import keaPlugin from './index'

describe('babel-plugin-kea', () => {
  test('works with kea 2.0 logic input', () => {
    const oldCode = `
      const logic = kea({
        actions: { doit: true, }
      })
    `

    const { code } = transform(oldCode, {
      envName: 'production',
      code: true,
      babelrc: false,
      configFile: false,
      filename: 'scenes/page/index.ts',
      plugins: [keaPlugin],
    })

    expect(code).toMatchSnapshot()
  })

  test('works with kea 3.0 logic builders', () => {
    const oldCode = `
      const logic = kea([
        actions({ doit: true }),
      ])
    `

    const { code } = transform(oldCode, {
      envName: 'production',
      code: true,
      babelrc: false,
      configFile: false,
      filename: 'scenes/page/index.ts',
      plugins: [keaPlugin],
    })

    expect(code).toMatchSnapshot()
  })
})
