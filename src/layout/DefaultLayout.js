import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import Dashboard from '../views/dashboard/Dashboard'
import { Row } from 'reactstrap'

const DefaultLayout = () => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <Row className="px-5">
          <Dashboard />
        </Row>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
