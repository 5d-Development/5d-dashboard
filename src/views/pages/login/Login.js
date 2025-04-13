import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '/assets/images/5d-logo.png'

import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CFormSwitch,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import './login.scss'

const Login = () => {
  const [login, setLogin] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const onChangeHandler = (e) => {
    const { name, value, type, checked } = e.target
    setLogin({
      ...login,
      [name]: type === 'checkbox' ? checked : value,
    })
  }
  const handleLogin = async (email, password) => {
    try {
      const res = await fetch('http://attendance-service.5d-dev.com/api/Employee/DashboardLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          keyAddress: password,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (login.rememberMe) {
        localStorage.setItem('authToken', data.token)
      } else {
        sessionStorage.setItem('authToken', data.token)
      }

      navigate('/employees')
    } catch (error) {
      // Swal.fire({
      //   icon: 'error',
      //   title: 'Login Failed',
      //   text: error.message || 'An error occurred during login. Please try again.',
      // })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!login.email || !login.password) {
      // Swal.fire({
      //   icon: 'error',
      //   title: 'Missing Fields',
      //   text: 'Please fill in both email and password fields.',
      // })
      return
    }

    setIsLoading(true)
    await handleLogin(login.email, login.password)
    setIsLoading(false)
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center login">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <div className="d-flex flex-column align-items-center">
                      <p className="text-body-secondary">
                        <img src={logo} alt="logo" />
                      </p>
                    </div>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
                        name="email"
                        value={login.email}
                        onChange={onChangeHandler}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        name="password"
                        value={login.password}
                        onChange={onChangeHandler}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CFormSwitch
                        label="Remember me"
                        id="formSwitchCheckChecked"
                        name="rememberMe"
                        checked={login.rememberMe}
                        onChange={onChangeHandler}
                      />
                    </CInputGroup>
                    <CRow>
                      <CButton
                        type="submit"
                        className="px-4 login-btn"
                        disabled={isLoading}
                        aria-label={isLoading ? 'Logging in...' : 'Log in'}
                      >
                        {isLoading ? 'Logging in...' : 'Log in'}
                      </CButton>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
