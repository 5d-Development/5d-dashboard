/* eslint-disable prettier/prettier */
import { Button } from 'reactstrap'
import './EmployeeDetails.scss'
import { useNavigate } from 'react-router-dom'
import { MoveLeft } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { useLocation } from 'react-router-dom' // Import useLocation

import axios from 'axios'

const EmployeeDetailsContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { employeeId } = location.state || {}
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editFormData, setEditFormData] = useState(employee || {})

  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])

  useEffect(() => {
    axios
      .get('http://attendance-service.5d-dev.com/api/Employee/GetDepartments')
      .then((response) => setDepartments(response.data))

    axios
      .get('http://attendance-service.5d-dev.com/api/Employee/GetAllManagers')
      .then((response) => setManagers(response.data))
  }, [])

  // Fetch employee details
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

      if (!authToken) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No authentication token found. Please log in.',
        })
        return
      }

      setLoading(true)
      try {
        const response = await axios.get(
          `http://attendance-service.5d-dev.com/api/Employee/GetEmployeeWithId?id=${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        )
        setEmployee(response.data)

        setEditFormData({
          name: response.data.name,
          email: response.data.email,
          department: response.data.department,
          jobTitle: response.data.jobTitle || '',
          managerId: +response.data.managerId || '',
          mobileNumber: response.data.mobileNumber || '',
          id: parseInt(response.data.id),
          secondName: '',
          isActive: response.data.isActive,
          normalVacationBalance: response.data.normalVacationBalance,
          incidentalVacationBalance: response.data.incidentalVacationBalance || 0,
          arrivalDepartureBalance: response.data.arrivalDepartureBalance || 0,
          keyAddress: '',
          isRemote: response.data.isRemote,
          isManager: response.data.isManager,
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch employee details.' + error,
        })
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchEmployeeDetails()
    }
  }, [employeeId])
  useEffect(() => {
    if (employee) {
      setEditFormData({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        jobTitle: employee.jobTitle || '',
        managerId: +employee.managerId || '',
        mobileNumber: employee.mobileNumber || '',
        id: parseInt(employee.id),
        secondName: '',
        isActive: employee.isActive,
        normalVacationBalance: +employee.normalVacationBalance || 0,
        incidentalVacationBalance: +employee.incidentalVacationBalance || 0,
        arrivalDepartureBalance: employee.arrivalDepartureBalance || 0,
        keyAddress: '',
        isRemote: employee.isRemote,
        isManager: employee.isManager,
      })
    }
  }, [employee])

  // Handle edit form input changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Handle edit form submission
  const handleEditFormSubmit = async (e) => {
    e.preventDefault()

    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

    if (!authToken) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No authentication token found. Please log in.',
      })
      return
    }

    const payload = {
      id: parseInt(employeeId),
      name: editFormData.name,
      secondName: '',
      department: editFormData.department,
      email: editFormData.email,
      jobTitle: editFormData.jobTitle,
      mobileNumber: editFormData.mobileNumber,
      isActive: editFormData.isActive,
      managerId: parseInt(editFormData.managerId) || 0,
      normalVacationBalance: parseInt(editFormData.normalVacationBalance),
      incidentalVacationBalance: parseInt(editFormData.incidentalVacationBalance),
      arrivalDepartureBalance: 0,
      keyAddress: '',
      isRemote: editFormData.isRemote,
      isManager: editFormData.isManager,
    }

    try {
      await axios.post(
        `http://attendance-service.5d-dev.com/api/Employee/UpdateEmployee?id=${employeeId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      )

      // Find the new manager's name
      const newManager = managers.find((m) => m.id === parseInt(editFormData.managerId))

      // Update local employee state immediately
      setEmployee((prev) => ({
        ...prev,
        ...editFormData,
        managerName: newManager ? newManager.name : prev.managerName, // Update managerName
      }))

      Swal.fire('Success', 'Employee updated successfully!', 'success')

      // Close the modal
      const modal = document.getElementById('modal-fadein')
      if (modal) {
        modal.classList.remove('show')
        modal.style.display = 'none'
        document.body.classList.remove('modal-open')
        const modalBackdrop = document.querySelector('.modal-backdrop')
        if (modalBackdrop) {
          modalBackdrop.remove()
        }
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update employee.', 'error')
      console.error('Error updating employee:', error)
    }
  }
  if (loading) {
    return (
      <div className="LOADER">
        <span
          id="loading"
          className="loader LOADER"
          style={{ textAlign: 'center', padding: '20px' }}
        ></span>
      </div>
    )
  }

  if (!employee) {
    return <div>Employee not found.</div>
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="employee-details">
      <Button onClick={handleBack} color="primary" outline className="d-flex gap-2">
        <MoveLeft />
        Back
      </Button>
    </div>
  )
}

export default EmployeeDetailsContent
