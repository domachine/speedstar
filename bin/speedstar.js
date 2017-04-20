#!/usr/bin/env node

'use strict'

const bluebird = require('bluebird')
const debug = require('util').debuglog('speedstar')
const fs = bluebird.promisifyAll(require('fs'))
const { dirname } = require('path')
const mkdirp = bluebird.promisify(require('mkdirp'))
const gaze = require('gaze')
const { join } = require('path')

const buildPages = require('../lib/build-pages')
const buildTemplates = require('../lib/build-templates')

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  const args = require('subarg')(process.argv.slice(2))
  const templatePattern = args.templates || 'templates/*'
  const templateBasedir = (
    args['template-basedir'] ||
      join(process.cwd(), 'templates')
  )
  const pagesBasedir = args['pages-basedir'] || join(process.cwd(), 'pages')
  const output = args.output || args.o || 'app.js'
  const pagesPrefix = 'pages/'
  const pagesSuffix = '.md'
  const pagesPattern = `${pagesPrefix}**/*${pagesSuffix}`
  const watch = args.watch || args.w || false
  const doBuild = async () => {
    const [templates, pages] = await Promise.all([
      buildTemplates({ pattern: templatePattern, basedir: templateBasedir }),
      buildPages({ pattern: pagesPattern, basedir: pagesBasedir })
    ])
    await mkdirp(dirname(output))
    const code = `\
module.exports={\
"templates":${templates},\
"pages":${JSON.stringify(pages)},\
"pagesPrefix":${JSON.stringify(pagesPrefix)},\
"pagesSuffix":${JSON.stringify(pagesSuffix)}\
}`
    await fs.writeFileAsync(output, code)
  }
  if (watch) {
    console.time('initial build')
    doBuild()
      .then(() => { console.timeEnd('initial build') })
    gaze([pagesPattern, templatePattern], (err, watcher) => {
      if (err) return error(err)
      let count = 0
      watcher.on('all', () => {
        const id = ++count
        console.time('rebuild')
        doBuild()
          .then(() => {
            if (count !== id) return
            console.timeEnd('rebuild')
          })
      })
    })
  } else doBuild()
}

function error (err) {
  debug(err.stack)
  console.error('speedstar: %s', err.message)
  process.exit(1)
}
