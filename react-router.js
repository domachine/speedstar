import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'

import boot from '../speedstar-boot'

class PageLoader extends Component {
  constructor ({ app, page }) {
    super()
    this.state = { page }
  }

  componentDidMount () {
    const { app, page, location } = this.props
    if (page) return
    boot(app, location.pathname, (page, pageObject) => {
      this.setState({ page: pageObject })
    })
  }

  componentWillReceiveProps ({ app, location }) {
    if (location !== this.props.location) {
      boot(app, location.pathname, (page, pageObject) => {
        this.setState({ page: pageObject })
      })
    }
  }

  render () {
    const { children } = this.props
    const { page } = this.state
    return (
      page
        ? React.cloneElement(children, { page })
        : null
    )
  }
}

export default function App (ownProps) {
  const { app: { templates, pages }, notFound } = ownProps
  const NotFound = notFound ? pages[notFound] : null
  if (NotFound && !templates[NotFound.template]) {
    throw new Error('404 template not found!')
  }
  return (
    <Switch>
      {
        Object.keys(pages).filter(page => page !== notFound).map(page => {
          const Template = templates[pages[page].template]
          return (
            <Route
              key={page}
              exact
              strict
              path={`/${page.replace(/(^|\/)index$/, '$1')}`}
              render={props => (
                <PageLoader app={ownProps.app} page={ownProps.page}>
                  <Template {...props} {...ownProps} page={page} />
                </PageLoader>
              )}
            />
          )
        })
        .concat(
          NotFound
            ? [
              <Route
                key={notFound}
                component={templates[NotFound.template]}
              />
            ]
            : []
        )
      }
    </Switch>
  )
}
