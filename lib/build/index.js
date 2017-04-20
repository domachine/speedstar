'use strict'

const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const { dirname } = require('path')
const mkdirp = bluebird.promisify(require('mkdirp'))
const gaze = require('gaze')

const buildPages = require('../speedstar-build-pages')
const buildTemplates = require('../speedstar-build-templates')

module.exports = build

async function build ({
  templatePattern,
  templateBasedir,
  pagesPrefix,
  pagesSuffix,
  pagesBasedir,
  output
}, args) {
  const pagesPattern = `${pagesPrefix}**/*${pagesSuffix}`
  const doTemplates = () =>
    buildTemplates({ pattern: templatePattern, basedir: templateBasedir })
  const doPages = () =>
    buildPages({ pattern: pagesPattern, basedir: pagesBasedir })
  const doBuild = async () => {
    const [templates, pages] = await Promise.all([doTemplates(), doPages()])
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
  if (args.watch || args.w) {
    return new Promise((resolve, reject) => {
      console.time('initial build')
      doBuild()
        .then(() => { console.timeEnd('initial build') })
      gaze([pagesPattern, templatePattern], (err, watcher) => {
        if (err) return reject(err)
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
    })
  } else return doBuild()
}
