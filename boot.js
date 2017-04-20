'use strict'

var matter = require('gray-matter')

module.exports = boot

function boot (app, pathname, fn) {
  var loadPage = function (url) {
    return new Promise(function (resolve, reject) {
      var xhr = new window.XMLHttpRequest()
      xhr.open('GET', '/' + app.pagesPrefix + url + app.pagesSuffix, true)
      xhr.onerror = function () { reject(xhr) }
      xhr.onload = function () {
        if ((xhr.status / 100 | 0) === 2) {
          return resolve(matter(xhr.responseText))
        }
        reject(xhr)
      }
      xhr.send()
    })
  }
  var page = (
    pathname
      .replace(/\/$/, '/index')
      .replace(/^\/+(.+)$/, '$1')
      .replace(/\/{2,}/g, '/')
  )
  return loadPage(page).then(function (pageObject) { fn(page, pageObject) })
}
