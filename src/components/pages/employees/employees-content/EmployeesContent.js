import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, MoveRight, Search } from 'lucide-react'
import { MultiSelect } from 'primereact/multiselect'
import 'primereact/resources/themes/lara-light-blue/theme.css' // PrimeReact theme
import 'primereact/resources/primereact.min.css' // Core styles
import 'primeicons/primeicons.css' // Icons
import check from '/assets/images/check.png'
import errorIcon from '/assets/images/error.png'
import employee from '/assets/images/employee.jpg'
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
  CButton,
} from '@coreui/react'

import axios from 'axios'
import {
  Badge,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Form,
  FormGroup,
  Label,
  Input,
} from 'reactstrap'
import { Loader, Pagination, ModalMaker } from '../../../ui'
import './EmployeesContent.scss'
import { useNavigate } from 'react-router-dom'

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
  const [modal, setModal] = useState(false)
  const [modalMessageVisible, setModalMessageVisible] = useState(false)
  const [modalMessage, setModalMessage] = useState(null)
  const toggle = () => setModal(!modal)

  const navigate = useNavigate()

  const handleRowClick = (employeeId) => {
    navigate('/employee', { state: { employeeId } })
  }
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

      setModal(false)
      setModalMessageVisible(true)
      setModalMessage(
        <div className="d-flex flex-column align-items-center gap-4">
          <img src={check} width={70} height={70} />
          <h4>Email Added Successfully</h4>
        </div>,
      )
      fetchEmployees(currentPage, ITEMS_PER_PAGE)
    } catch (error) {
      setModal(false)
      setModalMessageVisible(true)
      setModalMessage(
        <div className="d-flex flex-column align-items-center gap-4">
          <img src={errorIcon} width={70} height={70} />
          <h4> Oops ! this email already exists</h4>
        </div>,
      )
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
  const noFiltersApplied =
    !searchTerm && selectedDepartment.length === 0 && selectedManager.length === 0
  const handleCloseModal = () => {
    setModal(!modal)
    setEmployeeData({
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
  }
  return (
    <div className="employees">
      <div className="title">
        <h4 className="fw-bold mb-0">Employees</h4>
        <p>Lorem Ipsum is simply dummy text </p>
      </div>

      <CRow>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
          <div className="d-flex gap-2 pt-4 pb-3 ">
            <MultiSelect
              options={departmentOptions}
              placeholder="Department"
              value={selectedDepartment}
              onChange={(e) => handleFilterChange('department', e.value)}
              optionLabel="label"
              display="chip"
              style={{ minWidth: '200px' }}
              disabled={loading}
              filter
              showSelectAll={false}
            />
            <MultiSelect
              options={managersOptions}
              placeholder="Manager"
              value={selectedManager}
              onChange={(e) => handleFilterChange('manager', e.value)}
              optionLabel="label"
              display="chip"
              style={{ minWidth: '200px' }}
              disabled={loading}
              filter
              showSelectAll={false}
            />
          </div>

          <div className="d-flex gap-2 algin-items-center w-auto mb-3 mb-md-0">
            <CInputGroup className="flex-nowrap">
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
            <CButton color="primary" className="w-100" onClick={toggle}>
              Add Employee
            </CButton>
            <ModalMaker modal={modal} toggle={toggle} centered size={'xl'}>
              <div className="add-employee pe-5 ">
                <Row>
                  <Col md={6}>
                    <div className="position-relative">
                      <div className="position-absolute end-0 p-4">
                        <Button outline color="light" className="rounded-pill back-btn">
                          Back To Website <MoveRight />
                        </Button>
                      </div>

                      <img
                        src={employee}
                        className="img-fluid rounded-3"
                        style={{ height: '650px' }}
                      />
                    </div>
                  </Col>
                  <Col md={1}></Col>
                  <Col md={5}>
                    <h1 className="my-4">Add Employee</h1>
                    <Form onSubmit={handleSubmit}>
                      <Row>
                        <Col>
                          <Input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter Employee Name"
                            value={employeeData.name}
                            onChange={handleEmployeeChange}
                          />
                        </Col>
                        <Col>
                          <Input
                            required
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter Employee Email"
                            value={employeeData.email}
                            onChange={handleEmployeeChange}
                          />
                        </Col>
                      </Row>
                      <Row className="my-4">
                        <Col>
                          <Input
                            type="select"
                            id="department"
                            name="department"
                            required
                            value={employeeData.department}
                            onChange={handleEmployeeChange}
                          >
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.name}>
                                {dept.name}
                              </option>
                            ))}
                          </Input>
                        </Col>
                      </Row>

                      <Row>
                        <Col>
                          <Input
                            type="select"
                            id="manager"
                            name="manager"
                            required
                            value={employeeData.manager}
                            onChange={handleEmployeeChange}
                          >
                            {managers.map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.name}
                              </option>
                            ))}
                          </Input>
                        </Col>
                      </Row>
                      <Row className="my-4">
                        <Col>
                          <Input
                            type="tell"
                            id="mobileNumber"
                            name="mobileNumber"
                            required
                            placeholder="Enter Employee Mobile Number"
                            value={employeeData.mobileNumber}
                            onChange={handleEmployeeChange}
                          />
                        </Col>
                      </Row>
                      <Row className="mb-4">
                        <Col>
                          <Input
                            type="text"
                            id="jobTitle"
                            name="jobTitle"
                            placeholder="Enter Employee  jobTitle"
                            value={employeeData.jobTitle}
                            onChange={handleEmployeeChange}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <FormGroup className="d-flex gap-2 align-items-center" switch>
                            <Input
                              type="switch"
                              id="isPassedProbation"
                              name="isPassedProbation"
                              onChange={handleEmployeeChange}
                              checked={employeeData.isPassedProbation}
                            ></Input>
                            <Label htmlFor="isPassedProbation" className="mb-0">
                              {' '}
                              isPassedProbation{' '}
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col>
                          <FormGroup className="d-flex gap-2 align-items-center" switch>
                            <Input
                              type="switch"
                              id="isRemote"
                              name="isRemote"
                              onChange={handleEmployeeChange}
                              checked={employeeData.isRemote}
                            ></Input>
                            <Label htmlFor="isRemote" className="mb-0">
                              {' '}
                              isRemote{' '}
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row className="mt-4">
                        <Col>
                          <FormGroup className="d-flex gap-2 align-items-center " switch>
                            <Input
                              type="switch"
                              id="isManager"
                              name="isManager"
                              onChange={handleEmployeeChange}
                              checked={employeeData.isManager}
                            ></Input>
                            <Label htmlFor="isManager" className="mb-0">
                              is Manager{' '}
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                      <CButton color="primary" type="submit" className="px-3 w-100 py-2 mt-4">
                        Add
                      </CButton>
                    </Form>
                  </Col>
                </Row>
              </div>
            </ModalMaker>
            {modalMessageVisible && (
              <ModalMaker
                modal={modalMessageVisible}
                toggle={() => setModalMessageVisible(false)}
                centered
                modalControls={
                  <CButton
                    color="secondary"
                    onClick={() => setModalMessageVisible(false)}
                    className="px-3 w-100"
                  >
                    Ok
                  </CButton>
                }
              >
                {modalMessage}
              </ModalMaker>
            )}
          </div>
        </div>
        <CCol xs>
          <CCard className="mb-4 border-0">
            <>
              <CTable align="middle" className="mb-0 rounded-top overflow-hidden " hover responsive>
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
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        <Loader />
                      </CTableDataCell>
                    </CTableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        {noFiltersApplied ? (
                          <span>No filters applied. Showing all employees.</span>
                        ) : (
                          <span>No results found for selected filters.</span>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <CTableRow
                        className="pointer"
                        v-for="item in tableItems"
                        key={employee.id}
                        onClick={() => handleRowClick(employee.id)}
                      >
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
                    ))
                  )}
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
