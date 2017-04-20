import matter from 'gray-matter'

export default function boot (app, pathname, fn) {
  const { pagesPrefix, pagesSuffix } = app
  const loadPage = (url) => {
    return new Promise((resolve, reject) => {
      const xhr = new window.XMLHttpRequest()
      xhr.open('GET', `/${pagesPrefix}${url}${pagesSuffix}`, true)
      xhr.onerror = () => reject(xhr)
      xhr.onload = () => {
        if ((xhr.status / 100 | 0) === 2) {
          return resolve(matter(xhr.responseText))
        }
        reject(xhr)
      }
      xhr.send()
    })
  }
  const page = (
    pathname
      .replace(/\/$/, '/index')
      .replace(/^\/+(.+)$/, '$1')
      .replace(/\/{2,}/g, '/')
  )
  return loadPage(page).then(pageObject => fn(page, pageObject))
}
