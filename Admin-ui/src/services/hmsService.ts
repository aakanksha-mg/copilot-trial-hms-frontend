import { callApi, uploadFile } from './apiService'
import { APIRoutes } from './constant'
import type { ApiResponse } from '@/models/api'
import type {
  IHmsDashboardResponseBody,
  IHmsDashboardApiResponse,
  IDownloadReportRequest,
  IChannelStatsApiResponse,
  IDownloadReportResponseBody,
  IUploadFileListApiResponse,
  fileApiResponse,
  fileResponseBody,
  IFileUploadApiResponse,
} from '@/models/hmsdashboard'
import { apiClient } from './apiClient'
import { auth } from '@/auth'

export const HMSService = {
  hmsDashboard: async (data: IHmsDashboardResponseBody) => {
    try {
      const response = await callApi<ApiResponse<IHmsDashboardApiResponse>>(
        APIRoutes.HMS_DASHBOARD,
        [data],
      )
      console.log('hms dashboard response', response)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getGraphData: async (payload: {
    startDate: string
    endDate: string
    groupBy: number
  }) => {
    try {
      // External graph endpoint is proxied via node-proxy as `getGraphData`
      const response = await callApi<any>(APIRoutes.GET_GRAPH_DATA, [payload])
      return response
    } catch (error) {
      console.error('getGraphData error', error)
      throw error
    }
  },

  hmsOverviewStats: async (payload?: { pageNumber: number; pageSize: number }) => {
    try {
      const response = await callApi<ApiResponse<IChannelStatsApiResponse>>(
        APIRoutes.HMS_OVERVIEW_STATS,
        [payload ?? {}], // Pass empty object as data parameter
      )
      console.log('hms channel stats response', response)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  uploadFileList: async () => {
    try {
      const response = await callApi<ApiResponse<IUploadFileListApiResponse>>(
        APIRoutes.UPLOAD_FILE_LIST,
        [],
      )
      console.log('upload file list response', response)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  downloadReport: async (data: IDownloadReportRequest) => {
    try {
      const response = await callApi<ApiResponse<IDownloadReportResponseBody>>(
        APIRoutes.DOWNLOAD_REPORT,
        [data],
      )
      return response
    } catch (error) {
      console.error('downloadRecord service error:', error)
      throw error
    }
  },

  getHmsFile: async (formData: FormData) => {
    try {
      const response = await uploadFile<ApiResponse<IFileUploadApiResponse>>(
        formData,
        APIRoutes.HMS_FILE,
      )
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getRoles: async () => {
    try {
      const response = await callApi(
        APIRoutes.GET_ROLES,
        [{}],
      )
      return response
    } catch (error) {
      console.error('downloadRecord service error:', error)
      throw error
    }
  },

  deleteRoles: async (roleId: number | string) => {
    try {
      const response = await callApi(
        APIRoutes.DELETE_ROLES,
        [
          { roleId }
        ],
      )

      return response
    } catch (error) {
      console.error('delete role service error:', error)
      throw error
    }
  },

  fetchMenu: async (roleId: number | string) => {
    try {
      const response = await callApi(
        APIRoutes.FETCH_MENU,
        [
          { roleId }
        ],
      )

      return response
    } catch (error) {
      console.error('fetch menu service error:', error)
      throw error
    }
  },

  fetchRoleUsers: async (roleId: number | string) => {
    try {
      const response = await callApi(
        APIRoutes.ROLE_USER_LIST,
        [{ roleId }]
      )
      return response
    } catch (error) {
      console.error('fetch role users error:', error)
      throw error
    }
  },

  grantMenuAccess: async (payload: {
    roleId: number
    menuId: number
  }) => {
    return callApi("grantMenu", [
      payload
    ])
  },

  revokeMenuAccess: async (payload: {
    roleId: number
    menuId: number
  }) => {
    return callApi("revokeMenu", [
      payload
    ])
  },

  removeUserFromRole: async (payload: {
    userName: string
    roleId: number
  }) => {
    return callApi("removeUser", [
      payload
    ])
  },

  createRole: async (payload: {
    roleName: string
    rowVersion: number
    role_ID: number
    isSystemRole: boolean
    isActive: boolean
  }) => {
    return callApi("createRole", [
      payload
    ])
  },

  assignUserToRole: async (payload: {
    userName: string
    roleId: number
  }) => {
    return callApi("addUser", [
      payload
    ])
  },

  getUserIds: async (payload: {
    username: string
    emailId: string
    mobileNumber: string
    isActive: boolean
  }) => {
    return callApi<unknown>('getUserIds', [payload])
  },

  getHierarchyData: async (payload: {
    roleId: number
    searchFor: number
  }) => {
    return callApi(
      "getHierarchy",
      [payload]
    )
  },


  updateFieldAccess: async (payload: {
    roleId: number,
    cntrlId: number,
    render: boolean,
    allowEdit: boolean,
    approverOneId: number,
    approverTwoId: number,
    approverThreeId: number,
    useDefaultApprover: boolean | null,
  }) => {
    return callApi(
      "fieldUpdate",
      [payload]
    )
  },


  getChannel: async (payload: {
    channelId: null,
    channelCode: null,
    channelName: null,
    description: null,
    isActive: boolean,
  }) => {
    return callApi(
      "getChannel",
      [payload]
    )
  },

  subChannelList: async (payload: {
    subChannelId: null,
    subChannelCode: null,
    channelCode: string,
    subChannelName: string,
    description: string,
    isActive: boolean,
    channelId: number,
  }) => {
    return callApi(
      "getSubChannel",
      [payload]
    )
  },


  createChannel: async (payload: {
    channelId: null,
    channelCode: string,
    channelName: string,
    description: string,
    isActive: boolean,
  }) => {
    return callApi(
      "createChannel",
      [payload]
    )
  },

  createSubChannel: async (payload: {
    subChannelId: null,
    subChannelCode: string,
    channelCode: string,
    subChannelName: string,
    description: string,
    isActive: boolean,
    channelId: number,
  }) => {
    return callApi(
      "createSubChannel",
      [payload]
    )
  },

  fetchLocations: async (payload: {
    locationMasterId: null,
    channelId: number,
    subChannelId: number,
    locationCode: string,
    locationDesc: string,
    isActive: boolean,
  }) => {
    return callApi(
      "fetchLocations",
      [payload]
    )
  },

  saveLocation: async (payload: {
    locationMasterId: number,
    channelId: number,
    subChannelId: number,
    locationCode: string,
    locationDesc: string,
    isActive: boolean,
  }) => {
    return callApi(
      "saveLocations",
      [payload]
    )
  },

  getDesignationHierarchy: async (payload: {
    designationId: 0,
    parentDesignationId: 0,
    designationName: null,
    designationLevel: 0,
    isActive: boolean,
    channelId: number,
    codeFormat: "null",
    subChannelId: number,
  }) => {
    return callApi(
      "getDesignationHierarchy",
      [payload]
    )
  },

  saveDesignation: async (payload: {
    designationId: number,
    parentDesignationId: number,
    designationCode: string,
    designationName: string,
    designationLevel: number,
    isActive: boolean,
    channelId: number,
    codeFormat: string,
    subChannelId: number,
  }) => {
    return callApi(
      "saveDesignation",
      [payload]
    )
  },



  getBranchHierarchy: async (payload: {
    branchId: number,
    branchCode: null,
    branchName: null,
    address: null,
    state: number,
    phoneNumber: null,
    emailId: null,
    isActive: boolean,
    locationMasterId: number,
    parentBranchId: number,
    channelId: number,
    subChannelId: number,
  }) => {
    return callApi(
      "getBranchHierarchy",
      [payload]
    )
  },

  saveBranch: async (payload: {
    branchId: number,
    branchCode: string,
    branchName: string,
    address: null,
    state: number,
    phoneNumber: null,
    emailId: null,
    isActive: boolean,
    locationMasterId: number,
    parentBranchId: number,
    channelId: number,
    subChannelId: number,
  }) => {
    return callApi(
      "saveBranch",
      [payload]
    )
  },


  getPartnerHierarchy: async (payload: {
    partnerBranchHierarchyId: number,
    parentBranchHierarchyId: number,
    orgId: number,
    channelId: number,
    subChannelId: number,
    partnerBranchCode: string,
    partnerBranch: string,
    partnerAddress: string,
    partnerMail: string,
    partnerPhone: string,
    hierarchyPath: string,
    relationMgr: number
  }) => {
    return callApi(
      "getPartnerHierarchy",
      [payload]
    )
  },

  savePartner: async (payload: {
    partnerBranchHierarchyId: number | null,
    parentBranchHierarchyId: number,
    partnerBranch: string,
    partnerBranchCode: string,
    channelId: number,
    subChannelId: number,
    partnerAddress: string,
    partnerMail: string,
    partnerPhone: string,
    hierarchyPath: null,
    relationMgr: string,
  }) => {
    return callApi(
      "savePartner",
      [payload]
    )
  },

  search: async (payload: {
    searchCondition: string,
    zone: string,
    channelId: number,
    subChannelId: number,
  }) => {
    return callApi(
      "searchForPartner",
      [payload]
    )
  },

  getRefreshToken: async () => {
    return callApi("getRefreshToken", [{refreshToken: JSON.parse(auth.getToken())?.refreshToken}])
  },

  saveCustomField: async (payload: {
    key: string
    label: string
    type: string
    placeholder?: string | null
    required?: boolean
    minLength?: number | null
    maxLength?: number | null
    pattern?: string | null
    validationMessage?: string | null
    options?: string | null
    targetScreen: string
    targetTab: string
    targetSection: string
    sortOrder?: number
    isActive?: boolean
  }) => {
    return callApi(APIRoutes.SAVE_CUSTOM_FIELD, [payload])
  },

  getCustomFields: async (payload: {
    targetScreen?: string
    targetTab?: string
    targetSection?: string
    isActive?: boolean
  }) => {
    return callApi(APIRoutes.GET_CUSTOM_FIELDS, [payload])
  },

  createIndividualAgent: async (payload: {
    agentName: string
    firstName: string
    middleName: string | null
    lastName: string
    mobileNo: string
    email: string
    panNumber: string
    channel: number
    subChannel: number | null
    branch: number
    locationCode: number
    designationCode: number
    supervisorCode: string
  }) => {
    return callApi(APIRoutes.CREATE_INDIVIDUAL_AGENT, [payload])
  },
}



