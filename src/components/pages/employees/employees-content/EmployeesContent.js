import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { MultiSelect } from 'primereact/multiselect'
import 'primereact/resources/themes/lara-light-blue/theme.css' // PrimeReact theme
import 'primereact/resources/primereact.min.css' // Core styles
import 'primeicons/primeicons.css' // Icons
import './EmployeesContent.scss'
import {
  CAvatar,
  CCard,
  CCol,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import axios from 'axios'
import { Badge } from 'reactstrap'
import Pagination from './Pagination'

const Dashboard = () => {
  const [employeeData, setEmployeeData] = useState({
    name: '',
    email: '',
    department: '',
    manager: '',
    mobileNumber: '',
    jobTitle: '',
    isPassedProbation: false,
    isRemote: false,
    isManager: false,
  })

  const [employees, setEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState([])
  const [selectedManager, setSelectedManager] = useState([])
  const ITEMS_PER_PAGE = 10
  useEffect(() => {
    // Fetch departments and managers
    axios
      .get('http://attendance-service.5d-dev.com/api/Employee/GetDepartments')
      .then((res) => setDepartments(res.data))

    axios
      .get('http://attendance-service.5d-dev.com/api/Employee/GetAllManagers')
      .then((res) => setManagers(res.data))
  }, [])

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target
    setEmployeeData((prev) => {
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = {
      name: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      managerId: employeeData.manager,
      jobTitle: employeeData.jobTitle,
      mobileNumber: employeeData.mobileNumber,
      isPassedProbation: employeeData.isPassedProbation,
      isNormal: true,
      isManager: employeeData.isManager,
      isRemote: employeeData.isRemote,
    }

    try {
      await axios.post('http://attendance-service.5d-dev.com/api/Employee/AddEmployee', formData)

      Swal.fire('Success', 'Employee added successfully!', 'success')

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

      fetchEmployees(currentPage, ITEMS_PER_PAGE)
    } catch (error) {
      Swal.fire('Error', 'employee email is already exist .', 'error')
      console.error('Error adding employee:', error)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage) // Set current page to new page
    fetchEmployees(newPage, ITEMS_PER_PAGE)
  }

  const filteredEmployees = employees.filter((employee) => {
    const filteredDepartments =
      selectedDepartment.length === 0 || selectedDepartment.includes(Number(employee.department))

    const filteredManagers =
      selectedManager.length === 0 || selectedManager.includes(employee.managerId)

    return filteredDepartments && filteredManagers
  })
  const fetchEmployees = async (pageNumber, pageSize) => {
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
        `http://attendance-service.5d-dev.com/api/Employee/GetAllEmployees?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      )

      if (response.data && response.data.totalPages) {
        setEmployees(response.data.employees)
        setTotalPages(response.data.totalPages)
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch employee data.' + err,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees(currentPage, ITEMS_PER_PAGE)
  }, [currentPage])

  const departmentOptions = departments.map((dept) => ({
    label: dept.name,
    value: dept.id,
  }))

  const managersOptions = managers.map((manager) => ({
    label: manager.name,
    value: manager.id,
  }))

  const handleSearchChange = async (e) => {
    const searchValue = e.target.value
    setSearchTerm(searchValue)

    fetchFilteredEmployees(searchValue, selectedDepartment, selectedManager)
  }

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'department') {
      setSelectedDepartment(value)
      fetchFilteredEmployees(searchTerm, value, selectedManager)
    } else if (filterType === 'manager') {
      setSelectedManager(value)
      fetchFilteredEmployees(searchTerm, selectedDepartment, value)
    }
  }
  const fetchFilteredEmployees = async (
    searchValue,
    department,
    manager,
    // page = 1
  ) => {
    setLoading(true)
    try {
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

      let queryParams = []
      if (searchValue) queryParams.push(`searchTerm=${encodeURIComponent(searchValue)}`)
      if (department.length > 0) queryParams.push(`departments=${department.join(',')}`)
      if (manager.length > 0) queryParams.push(`managerId=${manager.join(',')}`)

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''

      const response = await axios.get(
        `http://attendance-service.5d-dev.com/api/Employee/SearchEmployees${queryString}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      )
      if (Array.isArray(response.data)) {
        setEmployees(response.data)
        setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE))
      } else {
        console.error('Unexpected API response format:', response.data)
        setEmployees([])
      }
    } catch (error) {
      console.error('Error fetching search results:', error)
      Swal.fire('Error', 'Failed to fetch search results.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="employees">
      <div className="title">
        <h4 className="fw-bold mb-0">Employees</h4>
        <p>Lorem Ipsum is simply dummy text </p>
      </div>

      <CRow>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2 pt-4 pb-3">
            <MultiSelect
              options={departmentOptions}
              placeholder="Department"
              value={selectedDepartment}
              onChange={(e) => handleFilterChange('department', e.value)}
            />
            <MultiSelect
              options={managersOptions}
              placeholder="Manager"
              value={selectedManager}
              onChange={(e) => handleFilterChange('manager', e.value)}
            />
          </div>

          <CInputGroup>
            <CInputGroupText>
              <Search size={18} />
            </CInputGroupText>
            <CFormInput
              id="autoSizingInputGroup"
              placeholder="Search In Table"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </CInputGroup>
        </div>
        <CCol xs>
          <CCard className="mb-4 border-0">
            <>
              <CTable align="middle" className="mb-0 " hover responsive>
                <CTableHead className="text-nowrap ">
                  <CTableRow>
                    <CTableHeaderCell>
                      <div className="d-flex align-items-center gap-2">
                        <span>NAME</span>
                        <ChevronDown size={21} />
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <div className="d-flex align-items-center gap-2">
                        <span>EMAIL</span>
                        <ChevronDown size={21} />
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <div className="d-flex align-items-center gap-2">
                        <span>DEPARTMENT</span>
                        <ChevronDown size={21} />
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <div className="d-flex align-items-center gap-2">
                        <span>MANAGER</span>
                        <ChevronDown size={21} />
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      {' '}
                      <div className="d-flex align-items-center gap-2">
                        <span>WORK MODE</span>
                        <ChevronDown size={21} />
                      </div>
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredEmployees.map((employee) => (
                    <CTableRow v-for="item in tableItems" key={employee.id}>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-3">
                          {employee.imagePath ? (
                            <CAvatar
                              size="md"
                              src={`http://attendance-service.5d-dev.com${employee.imagePath}`}
                              status={'success'}
                            />
                          ) : (
                            <CAvatar size="md" src="https://placehold.co/30x30" />
                          )}
                          <div>
                            <div className="employee-name">{employee.name}</div>
                            <div className="small text-body-secondary text-nowrap">
                              {employee.jobTitle}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="email">{employee.email}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="department">{employee.department}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{employee.managerName}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>
                          {' '}
                          {employee.isRemote ? (
                            'Remote'
                          ) : (
                            <Badge className="px-4 py-2 ">
                              {' '}
                              <div className="d-flex align-items-center gap-2">
                                {' '}
                                <Check size={15} />
                                <span>OnSite</span>
                              </div>
                            </Badge>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
            <div className="pt-4">
              {!searchTerm && selectedDepartment.length === 0 && selectedManager.length === 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Dashboard
