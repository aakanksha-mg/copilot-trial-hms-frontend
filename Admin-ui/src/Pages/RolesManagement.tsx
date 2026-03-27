import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { HMSService } from '@/services/hmsService'
import DataTable from '@/components/table/DataTable'
import { Pagination } from '@/components/table/Pagination'
import CustomTabs from '@/components/CustomTabs'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import FieldTreeView from '../components/ui/FieldTreeView'
import { showToast } from "@/components/ui/sonner"
import { NOTIFICATION_CONSTANTS } from '@/utils/constant'
import Loading from '@/components/ui/Loading'
import DynamicFormBuilder from '@/components/form/DynamicFormBuilder'
import { TAB_SECTION_MAP } from '@/services/uiAccessService'

// Reverse map: display name (from API) → tab value key
const TAB_DISPLAY_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SECTION_MAP).map(([k, v]) => [v, k])
)

// Normalize a display name to a snake_case key (e.g. "Individual Agent Action" → "individual_agent_action")
const normalizeKey = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

const RolesManagement = () => {
  type Role = {
    roleId: number
    roleName: string
  }
  type MenuAccess = {
    menuId: number
    menuName: string
    hasAccess: boolean
  }
  type RoleUser = {
    userId: number
    username: string
    emailId: string
    isActive: boolean
    isLocked: boolean
    failedLoginAttempts: number
  }
  type UserLookup = {
    userId?: number
    username: string
    emailId?: string
    mobileNumber?: string
    isActive?: boolean
  }

  type FieldAccess = {
    fieldId: number
    fieldName: string

    edit: boolean
    render: boolean
    createLog: boolean

    approvalMode: 'USER' | 'CUSTOM' | 'NONE'

    approver1: number | ''
    approver2: number | ''
    approver3: number | ''
  }


  const [activeTab, setActiveTab] = useState<'menu' | 'user' | 'field'>('menu')
  const [userList, setUserList] = useState<any[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [menuAccess, setMenuAccess] = useState<MenuAccess[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [menuLoading, setMenuLoading] = useState(false)
  const [openAddRole, setOpenAddRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [addingRole, setAddingRole] = useState(false)
  const [openAddUser, setOpenAddUser] = useState(false)
  const [userSearchText, setUserSearchText] = useState('')
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([])
  const [userSuggestions, setUserSuggestions] = useState<UserLookup[]>([])
  const [userSuggestionsLoading, setUserSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [fieldAccess, setFieldAccess] = useState<FieldAccess[]>([])
  const [fieldLoading, setFieldLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5 // how many rows per page
  const [treeData, setTreeData] = useState<any[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const searchDebounceRef = useRef<number | null>(null)
  // State for the "Add Field" dialog
  const [openAddField, setOpenAddField] = useState(false)
  const [addingField, setAddingField] = useState(false)
  const [selectedSectionForField, setSelectedSectionForField] = useState<any | null>(null)
  const selectedSet = useMemo(
    () => new Set(selectedUsernames.map(u => u.toLowerCase())),
    [selectedUsernames]
  )

  const addUsernameTag = (raw: string) => {
    const username = raw.trim()
    if (!username) return
    setSelectedUsernames(prev => {
      const exists = prev.some(u => u.toLowerCase() === username.toLowerCase())
      return exists ? prev : [...prev, username]
    })
  }

  const removeUsernameTag = (username: string) => {
    setSelectedUsernames(prev => prev.filter(u => u !== username))
  }

  const clearAddUserDialog = () => {
    setUserSearchText('')
    setSelectedUsernames([])
    setUserSuggestions([])
    setShowSuggestions(false)
  }

  const commitInputTokens = (value: string) => {
    const parts = value
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)

    if (parts.length === 0) return

    parts.forEach(p => addUsernameTag(p))
    setUserSearchText('')
    setShowSuggestions(false)
  }

  useEffect(() => {
    if (!openAddUser) return

    // Load all users (or top list) on open, and refresh suggestions as user types.
    const query = userSearchText.trim()

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = window.setTimeout(async () => {
      setUserSuggestionsLoading(true)
      try {
        const res = await HMSService.getUserIds({
          username: query,
          emailId: '',
          mobileNumber: '',
          isActive: true,
        })

        // API response shape can vary; normalize to array of user-like objects.
        const list: any[] =
          res?.responseBody?.userList ||
          res?.responseBody?.users ||
          res?.responseBody ||
          res?.data?.responseBody?.userList ||
          res?.data?.responseBody?.users ||
          res?.data?.responseBody ||
          res?.data ||
          []

        const normalized: UserLookup[] = Array.isArray(list)
          ? list.map((u: any) => ({
              userId: u.userId ?? u.id ?? u.user_ID,
              username: u.username ?? u.userName ?? u.loginId ?? u.loginID ?? u,
              emailId: u.emailId ?? u.email ?? u.emailID,
              mobileNumber: u.mobileNumber ?? u.mobile ?? u.phone,
              isActive: u.isActive,
            }))
          : []

        setUserSuggestions(normalized.filter(u => Boolean(u.username)))
      } catch (error: any) {
        setUserSuggestions([])
        showToast(
          NOTIFICATION_CONSTANTS.ERROR,
          error?.response?.data?.responseHeader?.errorMessage ||
            error?.message ||
            'Failed to load users'
        )
      } finally {
        setUserSuggestionsLoading(false)
      }
    }, query.length === 0 ? 0 : 250)

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [openAddUser, userSearchText])


  const menuData = [
    {
      id: 1,
      name: 'HMS Dashboard (View)',
      menuDescription:
        'Allows user to view overall HMS dashboard.',
      checked: true,
    },
    {
      id: 2,
      name: 'View Agent',
      menuDescription:
        'Permission to view agent details.',
      checked: true,
    },
    {
      id: 3,
      name: 'Save Agent',
      menuDescription:
        'Allows user to create or update agent',
      checked: false,
    },
    {
      id: 4,
      name: 'Commission Report',
      menuDescription:
        'Enables access to commission reports',
      checked: true,
    },
    {
      id: 5,
      name: 'User Management',
      menuDescription:
        'Allows managing users, roles',
      checked: false,
    },
  ]

  const roleTabs = [
    { value: 'menu', label: 'Menu' },
    { value: 'user', label: 'User' },
    { value: 'field', label: 'Field Access' },
  ]

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await HMSService.getRoles()
        const apiRoles = response?.responseBody?.roles || []
          console.log("apiRoles",apiRoles)
        setRoles(apiRoles) // apiRoles must contain roleId + roleName
      } catch (error) {
        console.error('Failed to fetch roles:', error)
      }
    }

    fetchRoles()
  }, [])


  useEffect(() => {
    if (!selectedRole) return

    if (activeTab === 'menu') {
      displayMenu(selectedRole)
    } else if (activeTab === 'user') {
      fetchUserList(selectedRole)
    } else if (activeTab === 'field') {
      fetchFieldAccess(selectedRole)
    }
  }, [activeTab])


  useEffect(() => {
    if (!selectedRole || activeTab !== 'field') return

    const getHierarchy = async () => {
      try {
        const response = await HMSService.getHierarchyData({
          roleId: selectedRole.roleId,
          searchFor: 2,
        })

        if (response?.responseHeader?.errorCode === 1101) {
          const apiMenu =
            response?.responseBody?.uiMenuResponse?.uiMenu || []

          const formattedTree = apiMenu.map((screen: any, i: number) => ({
            id: `screen-${i}`,
            name: screen.section,
            type: 'root',
            children:
              screen.subSection?.map((tab: any, j: number) => ({
                id: `screen-${i}-tab-${j}`,
                name: tab.section,
                type: 'module',
                children:
                  tab.subSection?.map((section: any, k: number) => ({
                    id: `screen-${i}-tab-${j}-section-${k}`,
                    name: section.section,
                    type: 'menu',

                    // store full fieldList for later use
                    fieldList: section.fieldList || [],

                    // metadata for "Add Field" feature
                    screenName: screen.section,
                    tabKey: TAB_DISPLAY_TO_KEY[tab.section] || normalizeKey(tab.section),
                    sectionKey: normalizeKey(section.section),

                    // do NOT show fields in tree
                    children: [],
                  })) || [],
              })) || [],
          }))

          setTreeData(formattedTree)
        }
      } catch (error) {
        console.error('Failed to fetch hierarchy:', error)
      }
    }

    getHierarchy()
  }, [selectedRole, activeTab])



  const handleApiToast = (res: any) => {
    const message =
      res?.responseHeader?.errorMessage || 'Unexpected response'

    if (res?.responseHeader?.errorCode === 1101) {
      showToast(NOTIFICATION_CONSTANTS.SUCCESS, message)
    } else {
      showToast(NOTIFICATION_CONSTANTS.ERROR, message)
    }
  }

  /* ================= MENU TABLE COLUMNS ================= */

  const menuColumns = [
    {
      header: 'Menu Name',
      accessor: 'menuName',
    },
    {
      header: 'Access',
      accessor: (row: MenuAccess) => (
        <input
          type="checkbox"
          checked={row.hasAccess}
          onChange={(e) =>
            handleMenuAccessChange(row.menuId, e.target.checked)
          }
        />
      ),
      width: '120px',
    },
  ]



  /* ================= USER TABLE COLUMNS ================= */

  const userColumns = [
    {
      header: 'Login ID',
      accessor: 'username',
    },
    {
      header: 'Email',
      accessor: (row: RoleUser) => (
        <span
          className="block max-w-[240px] truncate"
          title={row.emailId}
        >
          {row.emailId}
        </span>
      ),
    },
    {
      header: 'Active',
      accessor: (row: RoleUser) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${row.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
            }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Locked',
      accessor: (row: RoleUser) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${row.isLocked
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
            }`}
        >
          {row.isLocked ? 'Yes' : 'No'}
        </span>
      ),
    },
    { header: 'Failed Attempts', accessor: 'failedLoginAttempts' },
    {
      header: 'Action',
      width: '80px',
      accessor: (row: RoleUser) => (
        <button
          onClick={() => handleDeleteUser(row.username)}
          className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
          title="Remove User"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ]

  const fieldColumns = [
    {
      header: 'Field',
      accessor: 'fieldName',
    },
    {
      header: 'Edit',
      accessor: (row: FieldAccess) => (
        <input
          type="checkbox"
          checked={row.edit}
          onChange={(e) =>
            updateFieldAccess(row.fieldId, 'edit', e.target.checked)
          }
        />
      ),
    },
    {
      header: 'Approver 1',
      accessor: (row: FieldAccess) => (
        <select
          value={row.approver1}
          onChange={(e) =>
            updateFieldAccess(
              row.fieldId,
              'approver1',
              e.target.value ? Number(e.target.value) : ''
            )}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select</option>
          {roles.map(role => (
            <option key={role.roleId} value={role.roleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Approver 2',
      accessor: (row: FieldAccess) => (
        <select
          value={row.approver2}
          onChange={(e) =>
            updateFieldAccess(
              row.fieldId,
              'approver2',
              e.target.value ? Number(e.target.value) : ''
            )}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select</option>
          {roles.map(role => (
            <option key={role.roleId} value={role.roleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Approver 3',
      accessor: (row: FieldAccess) => (
        <select
          value={row.approver3}
          onChange={(e) =>
            updateFieldAccess(
              row.fieldId,
              'approver3',
              e.target.value ? Number(e.target.value) : ''
            )}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select</option>
          {roles.map(role => (
            <option key={role.roleId} value={role.roleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Default Approver',
      accessor: (row: FieldAccess) => (
        <select
          value={row.defaultApprover}
          onChange={(e) =>
            updateFieldAccess(row.fieldId, 'defaultApprover', e.target.value)
          }
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select</option>
          {roles.map(role => (
            <option key={role.roleId} value={role.roleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      ),
    },
  ]


  const updateFieldAccess = async (
    fieldId: number,
    key: keyof FieldAccess,
    value: boolean | string | number
  ) => {
    if (!selectedRole) return

    let updatedRow: FieldAccess | null = null

    // 1️⃣ Update UI first
    setFieldAccess(prev =>
      prev.map(row => {
        if (row.fieldId !== fieldId) return row

        let newRow: FieldAccess

        if (key === 'approvalMode') {
          newRow = {
            ...row,
            approvalMode: value as 'USER' | 'CUSTOM' | 'NONE',
            approver1: '',
            approver2: '',
            approver3: '',
          }
        } else if (key === 'render') {
          const renderVal = Boolean(value)

          // If RENDER is turned OFF, EDIT must also be OFF
          if (!renderVal) {
            newRow = {
              ...row,
              render: false,
              edit: false,
            }
          } else {
            // Turning RENDER ON does NOT force EDIT on
            newRow = {
              ...row,
              render: true,
            }
          }
        } else if (key === 'edit') {
          const editVal = Boolean(value)

          if (editVal) {
            // If EDIT is turned ON, RENDER must be ON
            newRow = {
              ...row,
              edit: true,
              render: true,
            }
          } else {
            // Turning EDIT OFF does not change RENDER
            newRow = {
              ...row,
              edit: false,
            }
          }
        } else {
          newRow = {
            ...row,
            [key]: value,
          } as FieldAccess
        }
        updatedRow = newRow
        return newRow
      })
    )

    if (!updatedRow) return

    // 2️⃣ Convert approvalMode → useDefaultApprover
    let useDefaultApprover: boolean | null = null

    const mode =
      key === 'approvalMode'
        ? (value as 'USER' | 'CUSTOM' | 'NONE')
        : updatedRow.approvalMode

    if (mode === 'USER') {
      useDefaultApprover = true
    } else if (mode === 'CUSTOM') {
      useDefaultApprover = false
    } else {
      useDefaultApprover = null
    }

    if (updatedRow.approvalMode === 'USER') {
      useDefaultApprover = true
    } else if (updatedRow.approvalMode === 'CUSTOM') {
      useDefaultApprover = false
    } else {
      useDefaultApprover = null
    }

    // 3️⃣ Prepare API payload
    let payload = {}

    if (useDefaultApprover == null || useDefaultApprover == true) {
      payload = {
        roleId: selectedRole.roleId,
        cntrlId: updatedRow.fieldId,
        render: updatedRow.render,
        allowEdit: updatedRow.edit,
        approverOneId: null,
        approverTwoId: null,
        approverThreeId: null,
        useDefaultApprover,
      }
    }
    else {
      payload = {
        roleId: selectedRole.roleId,
        cntrlId: updatedRow.fieldId,
        render: updatedRow.render,
        allowEdit: updatedRow.edit,
        approverOneId: updatedRow.approver1 || null,
        approverTwoId: updatedRow.approver2 || null,
        approverThreeId: updatedRow.approver3 || null,
        useDefaultApprover,
      }
    }
    console.log("myPayload", payload);
    try {
      setGlobalLoading(true)
      const res = await HMSService.updateFieldAccess(payload)
      handleApiToast(res)
    } catch (error) {
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Server error'
      )
    }
    finally {
      setGlobalLoading(false)
    }
  }


  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      showToast(NOTIFICATION_CONSTANTS.WARNING, 'Role name is required')
      return
    }

    setAddingRole(true)

    try {
      const res = await HMSService.createRole({
        roleName: newRoleName,
        rowVersion: 0,
        role_ID: 0,
        isSystemRole: true,
        isActive: true
      })

      if (res?.responseHeader?.errorCode === 1101) {
        // Refresh role list OR push new role
        const response = await HMSService.getRoles()
        const apiRoles = response?.responseBody?.roles || []
        setRoles(apiRoles)

        setOpenAddRole(false)
        setNewRoleName('')
      }
      handleApiToast(res)

    } catch (error) {
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Server error'
      )
    } finally {
      setAddingRole(false)
    }
  }


  const handleAddUser = async () => {
    if (!selectedRole) return

    // Build final username list using current state + current input text (state updates are async)
    const inputParts = userSearchText
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)

    const finalUsernames = Array.from(
      new Set(
        [...selectedUsernames, ...inputParts].map(u => u.trim()).filter(Boolean)
      )
    )

    if (finalUsernames.length === 0) {
      showToast(NOTIFICATION_CONSTANTS.WARNING, 'Please add at least one user')
      return
    }

    setAddingUser(true)

    try {
      const results = await Promise.allSettled(
        finalUsernames.map((userName) =>
          HMSService.assignUserToRole({
            userName,
            roleId: selectedRole.roleId,
          })
        )
      )

      const successes = results.filter(
        (r) => r.status === 'fulfilled' && r.value?.responseHeader?.errorCode === 1101
      ).length

      const failures = results.length - successes

      if (successes > 0) {
        showToast(
          NOTIFICATION_CONSTANTS.SUCCESS,
          `Added ${successes} user${successes === 1 ? '' : 's'} to role`
        )
        await fetchUserList(selectedRole)
      }

      if (failures > 0) {
        showToast(
          NOTIFICATION_CONSTANTS.ERROR,
          `${failures} user${failures === 1 ? '' : 's'} could not be added`
        )
      }

      if (successes > 0 && failures === 0) {
        setOpenAddUser(false)
        clearAddUserDialog()
      }

    } catch (error) {
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Server error'
      )
    } finally {
      setAddingUser(false)
    }
  }

  const displayMenu = async (role: Role) => {
    setMenuAccess([])
    setMenuLoading(true)

    try {
      const res = await HMSService.fetchMenu(role.roleId)

      if (res?.responseHeader?.errorCode === 1101) {
        const apiMenu = res?.responseBody?.menuAccessList || []

        const formattedMenu = apiMenu.map((item: any) => ({
          menuId: item.menuId,
          menuName: item.parentMenuName
            ? `${item.parentMenuName} >> ${item.menuName}`
            : item.menuName,
          hasAccess: item.hasAccess,
        }))


        setMenuAccess(formattedMenu)
        setCurrentPage(1)
      } else {
        setMenuAccess([])
      }
    } catch (error: any) {
      setMenuAccess([])
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Failed to load menu'
      )
    } finally {
      setMenuLoading(false)
    }
  }

  const fetchFieldAccess = async (role: Role) => {
    setFieldLoading(true)
    setFieldAccess([])
    setFieldLoading(false)
  }


  const fetchUserList = async (role: Role) => {
    setUserLoading(true)
    setUserList([])

    try {
      const res = await HMSService.fetchRoleUsers(role.roleId)

      if (res?.responseHeader?.errorCode === 1101) {
        const users = res?.responseBody?.userList || []
        const formattedUsers: RoleUser[] = users.map((user: any) => ({
          userId: user.userId,
          username: user.username,
          emailId: user.emailId,
          isActive: user.isActive,
          isLocked: user.isLocked,
          failedLoginAttempts: user.failedLoginAttempts,
        }))

        setUserList(formattedUsers)
      } else {
        setUserList([])
      }
    } catch (error: any) {
      setUserList([])
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Failed to load users'
      )
    } finally {
      setUserLoading(false)
    }
  }

  const handleMenuAccessChange = async (
    menuId: number,
    isChecked: boolean
  ) => {
    if (!selectedRole) return

    const roleId = selectedRole.roleId

    console.log("roleId", roleId);
    console.log("menuId", menuId);
    // 🔹 Optimistic UI update
    setMenuAccess(prev =>
      prev.map(menu =>
        menu.menuId === menuId
          ? { ...menu, hasAccess: isChecked }
          : menu
      )
    )
    try {
      let res
      if (isChecked) {
        res = await HMSService.grantMenuAccess({ roleId, menuId })
      } else {
        res = await HMSService.revokeMenuAccess({ roleId, menuId })
      }
      handleApiToast(res)
    }
    catch (error) {
      // 🔴 Rollback if API fails
      setMenuAccess(prev =>
        prev.map(menu =>
          menu.menuId === menuId
            ? { ...menu, hasAccess: !isChecked }
            : menu
        )
      )
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Failed to update menu access'
      )
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this role?'
    )
    if (!confirmDelete) return

    try {
      const res = await HMSService.deleteRoles(roleId)

      if (res?.responseHeader?.errorCode === 1101) {
        setRoles(prev => prev.filter(r => r.roleId !== roleId))
        setSelectedRole(prev =>
          prev?.roleId === roleId ? null : prev
        )
      }

      handleApiToast(res)

    } catch (error: any) {
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
        error?.message ||
        'Server error'
      )
    }
  }

  const handleDeleteUser = async (userName: string) => {
    if (!selectedRole) return

    const roleId = selectedRole.roleId
    showToast(NOTIFICATION_CONSTANTS.ACTION, 'Remove user from this role?', {
      description: `User: ${userName}`,
      actionLabel: 'Remove',
      onAction: async () => {
        try {
          const res: any = await HMSService.removeUserFromRole({
            userName,
            roleId,
          })

          if (res?.responseHeader?.errorCode === 1101) {
            setUserList(prev => prev.filter(u => u.username !== userName))
          }

          handleApiToast(res)
        } catch (error: any) {
          showToast(
            NOTIFICATION_CONSTANTS.ERROR,
            error?.response?.data?.responseHeader?.errorMessage ||
              error?.message ||
              'Server error'
          )
        }
      },
    })
    return

  }
  const handleAddField = async (formData: Record<string, any>) => {
    if (!selectedSectionForField) return

    setAddingField(true)
    try {
      const payload = {
        key: formData.key,
        label: formData.label,
        type: formData.type,
        placeholder: formData.placeholder || null,
        required: false,
        minLength: null,
        maxLength: null,
        pattern: null,
        validationMessage: null,
        options: formData.options || null,
        targetScreen: selectedSectionForField.screenName,
        targetTab: selectedSectionForField.tabKey,
        targetSection: selectedSectionForField.sectionKey,
        sortOrder: Number(formData.sortOrder) || 100,
        isActive: true,
      }

      const res: any = await HMSService.saveCustomField(payload)
      handleApiToast(res)

      if (res?.responseHeader?.errorCode === 1101) {
        setOpenAddField(false)
      }
    } catch (error: any) {
      showToast(
        NOTIFICATION_CONSTANTS.ERROR,
        error?.response?.data?.responseHeader?.errorMessage ||
          error?.message ||
          'Failed to save field'
      )
    } finally {
      setAddingField(false)
    }
  }

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role)
    setFieldAccess([])
    setSelectedSectionForField(null)
    if (activeTab === 'menu') {
      displayMenu(role)
    } else if (activeTab === 'user') {
      fetchUserList(role)
    }
  }


  const totalPages = Math.ceil(menuAccess.length / pageSize)

  const paginatedMenu = menuAccess.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {globalLoading && <Loading />}
      <AlertDialog open={openAddRole} onOpenChange={setOpenAddRole}>
        <AlertDialogContent className="sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-800">
              Add New Role
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* BODY */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* FOOTER */}
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel
              onClick={() => setNewRoleName('')}
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </AlertDialogCancel>

            <button
              onClick={handleAddRole}
              disabled={addingRole}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {addingRole ? 'Saving...' : 'Submit'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openAddUser}
        onOpenChange={(open) => {
          setOpenAddUser(open)
          if (!open) clearAddUserDialog()
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-800">
              Add User To Role
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Users
            </label>

            {/* Tag input */}
            <div
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 bg-white"
              onClick={() => setShowSuggestions(true)}
            >
              <div className="flex flex-wrap gap-2">
                {selectedUsernames.map((u) => (
                  <span
                    key={u}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs"
                    title={u}
                  >
                    <span className="max-w-[180px] truncate">{u}</span>
                    <button
                      type="button"
                      className="text-blue-700/80 hover:text-blue-900"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeUsernameTag(u)
                      }}
                      aria-label={`Remove ${u}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={userSearchText}
                  onChange={(e) => {
                    const val = e.target.value
                    setUserSearchText(val)
                    setShowSuggestions(true)
                    // If user typed comma, commit immediately.
                    if (val.includes(',')) commitInputTokens(val)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitInputTokens(userSearchText)
                    }
                    if (e.key === 'Backspace' && userSearchText.length === 0 && selectedUsernames.length > 0) {
                      removeUsernameTag(selectedUsernames[selectedUsernames.length - 1])
                    }
                  }}
                  onBlur={() => {
                    // Give time for click selection from dropdown.
                    window.setTimeout(() => setShowSuggestions(false), 150)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={selectedUsernames.length ? 'Type more...' : 'Type username(s) and press Enter or comma'}
                  className="flex-1 min-w-[140px] outline-none border-0 px-1 py-1 text-sm"
                />
              </div>
            </div>

            {/* Suggestions */}
            {showSuggestions && (
              <div className="relative">
                <div className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {userSuggestionsLoading ? (
                    <div className="p-3 text-sm text-gray-500">Loading...</div>
                  ) : userSuggestions.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No users found</div>
                  ) : (
                    userSuggestions
                      .filter((u) => !selectedSet.has((u.username || '').toLowerCase()))
                      .slice(0, 20)
                      .map((u) => (
                        <button
                          key={`${u.userId ?? u.username}-${u.username}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            addUsernameTag(u.username)
                            setUserSearchText('')
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition"
                        >
                          <div className="text-sm font-medium text-gray-800">{u.username}</div>
                          {u.emailId && (
                            <div className="text-xs text-gray-500 truncate">{u.emailId}</div>
                          )}
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Tip: you can paste <span className="font-medium">user1,user2</span> and press Enter.
            </p>
          </div>

          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel
              onClick={() => clearAddUserDialog()}
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </AlertDialogCancel>

            <button
              onClick={handleAddUser}
              disabled={addingUser}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {addingUser ? 'Saving...' : 'Submit'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ADD FIELD DIALOG */}
      <AlertDialog open={openAddField} onOpenChange={setOpenAddField}>
        <AlertDialogContent className="sm:max-w-lg rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-800">
              Add Custom Field
            </AlertDialogTitle>
            {selectedSectionForField && (
              <p className="text-sm text-gray-500 mt-1">
                Screen: <strong>{selectedSectionForField.screenName}</strong> &nbsp;|&nbsp;
                Section: <strong>{selectedSectionForField.name}</strong>
              </p>
            )}
          </AlertDialogHeader>

          <div className="mt-4">
            <DynamicFormBuilder
              config={{
                gridCols: 2,
                fields: [
                  {
                    name: 'key',
                    label: 'Field Key',
                    type: 'text',
                    placeholder: 'e.g. custom_field_1',
                    colSpan: 1,
                  },
                  {
                    name: 'label',
                    label: 'Field Label',
                    type: 'text',
                    placeholder: 'e.g. My Custom Field',
                    colSpan: 1,
                  },
                  {
                    name: 'type',
                    label: 'Field Type',
                    type: 'select',
                    colSpan: 1,
                    options: [
                      { value: 'text', label: 'Text' },
                      { value: 'number', label: 'Number' },
                      { value: 'email', label: 'Email' },
                      { value: 'date', label: 'Date' },
                      { value: 'select', label: 'Select / Dropdown' },
                      { value: 'checkbox', label: 'Checkbox' },
                      { value: 'boolean', label: 'Toggle / Switch' },
                      { value: 'textarea', label: 'Text Area' },
                    ],
                  },
                  {
                    name: 'placeholder',
                    label: 'Placeholder',
                    type: 'text',
                    placeholder: 'Placeholder text…',
                    colSpan: 1,
                  },
                  {
                    name: 'sortOrder',
                    label: 'Sort Order',
                    type: 'number',
                    placeholder: '100',
                    colSpan: 1,
                  },
                  {
                    name: 'options',
                    label: 'Options (JSON – for select / checkbox)',
                    type: 'textarea',
                    placeholder: '[{"value":"opt1","label":"Option 1"}]',
                    colSpan: 2,
                  },
                ],
                defaultValues: { sortOrder: 100 },
                buttons: {
                  gridCols: 2,
                  items: [
                    {
                      label: addingField ? 'Saving…' : 'Save Field',
                      type: 'submit',
                      variant: 'blue',
                      colSpan: 1,
                    },
                  ],
                },
              }}
              onSubmit={handleAddField}
            />
          </div>

          <AlertDialogFooter className="mt-2 flex justify-end gap-3">
            <AlertDialogCancel
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex gap-6">
        {/* LEFT SIDE - ROLES */}
        <div className="bg-white rounded-2xl shadow-md border p-6 w-85">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Roles</h2>
              <p className="text-sm text-gray-500">
                Manage system access roles
              </p>
            </div>

            <button
              onClick={() => setOpenAddRole(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-2 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              <Plus size={16} />
              Add Role
            </button>
          </div>

          <ul className="space-y-1">
            {roles.map((role) => (
              <li
                key={role.roleId}
                onClick={() => handleRoleClick(role)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition
      ${selectedRole?.roleId === role.roleId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100'
                  }`}
              >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 flex items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-sm font-medium">{role.roleName}</span>
                </div>

                {/* DELETE ICON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation() // prevent role selection
                    handleDeleteRole(role.roleId)
                    console.log('Delete role:', role)
                  }}
                  className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

        </div>

        {/* RIGHT SIDE */}
        {selectedRole && (
          <div className="flex-1 bg-gray-150 rounded-2xl shadow-md border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedRole?.roleName} - Role Details
            </h3>

            {/* CUSTOM TABS (Same as Agent Page) */}
            {/* TABS */}

            {/* TAB + CONTENT WRAPPER */}
            <div className="rounded-xl">

              {/* TABS */}
              <div className="-ml-px pt-2">
                <CustomTabs
                  tabs={roleTabs}
                  defaultValue={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'menu' | 'user' | 'field')
                  }
                />
              </div>

              {/* CONTENT */}
              <div className="-ml-px p-4 -mt-px bg-white rounded-b-xl rounded-tr-xl">
                {/* MENU TAB */}
                {activeTab === 'menu' && (
                  <>
                    {menuLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">
                          Loading menu access...
                        </span>
                      </div>
                    ) : (
                      <>
                        <DataTable columns={menuColumns} data={paginatedMenu} />

                        {totalPages > 1 && (
                          <Pagination
                            totalPages={totalPages}
                            currentPage={currentPage}
                            onPageChange={(page) => setCurrentPage(page)}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* USER TAB */}
                {activeTab === 'user' && (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setOpenAddUser(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                      >
                        <Plus size={16} />
                        Add User
                      </button>
                    </div>

                    {userLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">
                          Loading users...
                        </span>
                      </div>
                    ) : (
                      <DataTable columns={userColumns} data={userList} />
                    )}
                  </>
                )}

                {/* FIELD TAB */}
                {activeTab === 'field' && (
                  <>
                    {fieldLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">
                          Loading field hierarchy...
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-4 h-[600px]">

                        {/* LEFT → TREE (SMALLER) */}
                        <div className="col-span-4 h-full overflow-y-auto pr-2" >
                          <FieldTreeView
                            data={treeData}
                            onSelect={(node) => {
                              console.log('Selected node:', node)

                              // Only load table if SECTION clicked
                              if (node.type === 'menu' && node.fieldList) {
                                const formattedFields = node.fieldList.map((field: any) => ({
                                  fieldId: field.cntrlid,
                                  fieldName: field.cntrlName,
                                  edit: field.allowedit,
                                  render: field.render,
                                  createLog: false,
                                  approvalMode: 'NONE',
                                  approver1: '',
                                  approver2: '',
                                  approver3: '',
                                }))

                                setFieldAccess(formattedFields)
                                setSelectedSectionForField(node)
                              }
                            }}
                          />

                        </div>

                        {/* RIGHT → TABLE (BIGGER) */}
                        <div className="col-span-8 bg-white border rounded-lg p-4 h-full overflow-auto">
                          {/* Add Field button – visible when a section is selected */}
                          <div className="flex justify-end mb-3">
                            <button
                              onClick={() => setOpenAddField(true)}
                              disabled={!selectedSectionForField}
                              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title={selectedSectionForField ? `Add field to "${selectedSectionForField.name}"` : 'Select a section first'}
                            >
                              <Plus size={16} />
                              Add Field
                            </button>
                          </div>
                          <div className="overflow-auto">
                            <table className="w-full border border-gray-300 text-sm">
                              {/* HEADER */}
                              <thead className="bg-gray-100">
                                <tr>
                                  {/* FIELD COLUMN (WIDER) */}
                                  <th
                                    rowSpan={2}
                                    className="border p-2 text-left w-[200px] min-w-[150px]"
                                  >
                                    Field
                                  </th>

                                  {/* UI ELEMENTS (SMALLER) */}
                                  <th
                                    rowSpan={2}
                                    className="border p-2 text-center w-[120px] min-w-[50px]"
                                  >
                                    UI Elements
                                  </th>

                                  {/* <th
                                    rowSpan={2}
                                    className="border p-2 text-center w-[110px]"
                                  >
                                    Log Changes
                                  </th> */}

                                
                                </tr>
                              </thead>

                              {/* BODY */}
                              <tbody>
                                {fieldAccess.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">
                                      Select a section from the tree to view field access
                                    </td>
                                  </tr>
                                ) : (
                                  fieldAccess.map(row => (
                                    <tr key={row.fieldId} className="hover:bg-gray-50 align-top">

                                      {/* FIELD */}
                                      <td className="border p-2">
                                        {row.fieldName}
                                      </td>

                                      {/* ✅ UI ELEMENTS COLUMN */}
                                      <td className="border p-3 align-top">
                                        <div className="space-y-4">

                                          {/* EDIT */}
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Edit</span>
                                            <Switch
                                              checked={row.edit}
                                              onCheckedChange={(checked) =>
                                                updateFieldAccess(row.fieldId, 'edit', checked)
                                              }
                                            />
                                          </div>

                                          {/* RENDER */}
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Render</span>
                                            <Switch
                                              checked={row.render}
                                              onCheckedChange={(checked) =>
                                                updateFieldAccess(row.fieldId, 'render', checked)
                                              }
                                            />
                                          </div>

                                        </div>
                                      </td>

                                      {/* ✅ LOG CHANGES COLUMN */}
                                      {/* <td className="border p-3 align-top">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-600">Log</span>
                                          <Switch
                                            checked={row.createLog}
                                            onCheckedChange={(checked) =>
                                              updateFieldAccess(row.fieldId, 'createLog', checked)
                                            }
                                          />
                                        </div>
                                      </td> */}

                                   

                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                    )}
                  </>
                )}

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
export default RolesManagement
