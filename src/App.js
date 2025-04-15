import React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './scss/style.scss'
import './scss/examples.scss'
import { Login, Reports } from './components/pages'
import Employees from './components/pages/employees/Employess'
import EmployeeDetails from './components/pages/employee-details/EmployeeDetails'

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/employee" element={<EmployeeDetails />} />
      </Routes>
    </HashRouter>
  )
}

export default App
