'use strict'

const bluebird = require('bluebird')
const { relative, resolve } = require('path')
const glob = bluebird.promisify(require('glob'))

module.exports = async ({ pattern, basedir }) => {
  const index = (
    (await glob(pattern))
      .map(path => {
        const id = JSON.stringify(resolve(process.cwd(), path))
        return {
          path: relative(basedir, path),
          component: `require(${id}).default||require(${id})`
        }
      })
  )
  const entriesJoined = (
    index
      .map(entry => `${JSON.stringify(entry.path)}:${entry.component}`)
      .join(',')
  )
  return `{${entriesJoined}}`
}
