'use strict'

const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const { relative, parse, join } = require('path')
const matter = require('gray-matter')
const glob = bluebird.promisify(require('glob'))

module.exports = async ({
  pattern = 'pages/**/*.md',
  basedir = process.cwd()
}) => {
  const index = (
    await Promise.all(
      (await glob(pattern))
        .map(async path => {
          const { dir, name } = parse(relative(basedir, path))
          const md = matter(await fs.readFileAsync(path, 'utf-8'))
          const { data: { template } = {} } = md
          return { path: join(dir, name), data: { template } }
        })
    )
  ).reduce(
    (templates, template) =>
      Object.assign({}, templates, {
        [template.path]: template.data
      }),
    {}
  )
  return index
}
