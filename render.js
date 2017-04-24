'use strict'

const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const { dirname, join } = require('path')
const matter = require('gray-matter')
const subarg = require('subarg')
const mkdirp = bluebird.promisify(require('mkdirp'))

module.exports = render

async function render ({ pages, pagesPrefix, pagesSuffix }, fn) {
  const { _: [output = 'dist'] } = subarg(process.argv.slice(2))
  if (!output) throw new Error('No output directory given')
  return Promise.all(
    Object.keys(pages).map(async page => {
      const abs = join(pagesPrefix, page) + pagesSuffix
      const res = await fs.readFileAsync(abs, 'utf-8')
      const pageObject = matter(res)
      delete pageObject.orig
      pageObject.name = page
      const str = await fn(page, pageObject)
      await mkdirp(dirname(join(output, page)))
      await fs.writeFileAsync(join(output, page) + '.html', str)
    })
  )
}
