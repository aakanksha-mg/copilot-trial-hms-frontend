const { setEncryptionEnabled } = require("../config/encryptionConfig");
const { apiClient } = require("./apiclient");
const { APIRoutes } = require("./constant");
const { encryptionService } = require("./encryptionService");

const getHRMChunks = () => {
  const config = loadEncryptionConfig();
  const token = {
    HRMChunks: encryptionService.getHrm_Key(),
    isEncryptionEnabled: config,
  };
  return token;
};
const loadEncryptionConfig = () => {
  const enabled = false;
  setEncryptionEnabled(enabled);
  return enabled;
};
const login = (data) => {
  console.log(data);

  return apiClient.post(APIRoutes.LOGIN, data);
};
const search = (data, headers = {}) => {
  console.log("aData", data);
  return apiClient.post(APIRoutes.AGENTSEARCH, data, { headers });
};
const searchbycode = (data, headers = {}) => {
  return apiClient.post(APIRoutes.AGENTBYCODE, data, { headers })
};
const Agentbyid = (data, headers = {}) => {
  return apiClient.post(APIRoutes.AGENTBYID, data, { headers });
};
const AgentByCode = (data, headers = {}) => {
  return apiClient.post(APIRoutes.AGENTBYCODE, data, { headers });
};
const GetMasters = (data, headers = {}) => {
  return apiClient.post(`${APIRoutes.GETMASTERS}/${data}`, {}, { headers });
};

const file = (data, headers = {}) => {
  console.log('====================================');
  console.log('File upload request:');
  console.log('Data type:', typeof data, 'Is FormData:', typeof data?.getHeaders === 'function');
  console.log('Headers:', headers);
  console.log('====================================');

  return apiClient.post(APIRoutes.UPLOADFILES, data, { headers }).then(response => {
    console.log('====================================');
    console.log('File upload response received:');
    console.log('Response type:', typeof response);
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('Response status:', response?.status);
    console.log('Response statusCode:', response?.statusCode);
    console.log('====================================');
    return response;
  }).catch(err => {
    console.error('====================================');
    console.error('File upload error:');
    console.error('Error:', err.message);
    console.error('====================================');
    throw err;
  });
};

const rolesList = (data, headers = {}) => {
  return apiClient.post(APIRoutes.GETROLES, data, { headers });
};

const deleteRole = async (data, headers = {}) => {
  const roleId = data?.roleId
  console.log("Deleting role:", roleId)
  return apiClient.post(`${APIRoutes.DELETEROLES}/${roleId}`, {}, { headers })
};

const fetchMenu = async (data, headers = {}) => {
  const roleId = data?.roleId
  return apiClient.post(`${APIRoutes.FETCHMENU}/${roleId}`, {}, { headers })
}

const userList = async (data, headers = {}) => {
  const roleId = data?.roleId
  return apiClient.post(`${APIRoutes.USERLIST}/${roleId}`, {}, { headers })
}

const grantMenu = async (data, headers = {}) => {
  console.log("gettingHere");
  console.log("grantMenu", data);
  console.log("FINAL REQUEST", {
    url: APIRoutes.GRANTMENU,
    body: {
      roleId: data.roleId,
      menuId: data.menuId,
    }
  });

  return apiClient.post(
    APIRoutes.GRANTMENU,     // ✅ NO roleId in URL
    {
      roleId: data.roleId,
      menuId: data.menuId,   // ✅ send menuId
    },
    { headers }
  );
};

const revokeMenu = async (data, headers = {}) => {
  console.log("revokeMenu", data);

  return apiClient.post(
    APIRoutes.REVOKEMENU,
    {
      roleId: data.roleId,
      menuId: data.menuId,
    },
    { headers }
  );
};

const removeUser = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.REMOVEUSER,
    {
      userName: data.userName,
      roleId: data.roleId,
    },
    { headers }
  );
};


const createRole = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.CREATEROLE,
    {
      roleName: data.roleName,
      rowVersion: data.rowVersion,
      role_ID: data.role_ID,
      isSystemRole: data.isSystemRole,
      isActive: data.isActive,
    },
    { headers }
  );
};

const addUser = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.ADDUSER,
    {
      userName: data.userName,
      roleId: data.roleId,
    },
    { headers }
  );
};

const getHierarchy = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.GETHIERARCHY,
    {
      roleId: data.roleId,
      searchFor: data.searchFor,
    },          // ✅ boolean payload
    { headers }
  );
};

const fieldUpdate = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.FIELDUPDATE,
    {
      roleId: data.roleId,
      cntrlId: data.cntrlId,
      render: data.render,
      allowEdit: data.allowEdit,
      approverOneId: data.approverOneId,
      approverTwoId: data.approverTwoId,
      approverThreeId: data.approverThreeId,
      useDefaultApprover: data.useDefaultApprover,
    },
    { headers }
  );
};

const getChannel = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.CHANNELLIST,
    {
      channelId: data.channelId,
      channelCode: data.channelCode,
      channelName: data.channelName,
      description: data.description,
      isActive: data.isActive,
    },
    { headers }
  );
}

const getSubChannel = async (data, headers = {}) => {
  const { channelId, ...body } = data

  return apiClient.post(
    `${APIRoutes.SUBCHANNELLIST}/${channelId}/SubChannel/Fetch`,
    {
      ...body,
      channelId
    },
    { headers }
  )
}

const fetchLocations = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Location/Fetch`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}

const saveLocations = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Location/Save`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}


const getDesignationHierarchy = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Designation/Fetch`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}

const createChannel = async (data, headers = {}) => {
  return apiClient.post(
    APIRoutes.CREATECHANNEL,
    {
      channelId: data.channelId,
      channelCode: data.channelCode,
      channelName: data.channelName,
      description: data.description,
      isActive: data.isActive,
    },
    { headers }
  );
}

const createSubChannel = async (data, headers = {}) => {
  const { channelId, ...body } = data

  return apiClient.post(
    `${APIRoutes.CREATESUBCHANNEL}/${channelId}/SubChannel/Create`,
    {
      ...body,
      channelId
    },
    { headers }
  )
}

const saveDesignation = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Designation/Save`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}

const getBranchHierarchy = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Branch/Fetch`,
    {
      ...body,
    },
    { headers }
  )
}

const saveBranch = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/Branch/Save`,
    {
      ...body,
    },
    { headers }
  )
}

const savePartner = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/PartnerBranchHierarchy/Save`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}

const getPartnerHierarchy = async (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(
    `/${APIRoutes.SUBCHANNELLIST}/${channelId}/${subChannelId}/PartnerBranchHierarchy/Fetch`,
    {
      ...body,
      channelId,
      subChannelId
    },
    { headers }
  )
}

const searchForPartner = (data, headers = {}) => {
  const { channelId, subChannelId, ...body } = data
  return apiClient.post(`${APIRoutes.AGENTSEARCHFORPARTNER}/${channelId}/${subChannelId}/Agent/Search`,
    {
      ...body,
      channelId,
      subChannelId
    }
    , { headers });
};

const getRefreshToken = (data, headers = {}) => {
  console.log("getting refreshToken",data);

  return apiClient.post(APIRoutes.REFRESHTOKEN,data, {  });
};

const GetMastersBulk = async (keys, headers = {}) => {
  const promises = keys.map(async (key) => {
    try {
      const res = await apiClient.post(
        `${APIRoutes.GETMASTERS}/${key}`,
        {},
        {
          headers,
        }
      );
      // apiClient.post() returns { status, data } where backend response is under data.
      const master =
        res?.data?.responseBody?.master ??
        res?.responseBody?.master ?? // fallback if apiClient shape changes
        [];
      return [key, master];
    } catch (err) {
      console.error(`Error fetching master ${key}`, err);
      return [key, []];
    }
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results);
};

const getCommissionData = (data = {}, headers = {}) => {
  // console.log("Fetching commission data with:", data);
  return apiClient.post(APIRoutes.GETCOMMISSION, data, { headers });
};
const processCommission = (data = {}, headers = {}) => {
  // console.log("Process commission with:", data);
  return apiClient.post(APIRoutes.PROCESSCOMMISSION, data, { headers });
};
const holdCommission = (data = {}, headers = {}) => {
  // console.log("hold commission with:", data);
  return apiClient.post(APIRoutes.HOLDCOMMISSION, data, { headers });
};
const adjustCommission = (data = {}, headers = {}) => {
  // console.log("Adjust commission with:", data);
  return apiClient.post(APIRoutes.ADJUSTCOMMISSION, data, { headers });
};
const approveCommission = (data = {}, headers = {}) => {
  // console.log("Approve commission with:", data);
  return apiClient.post(APIRoutes.APPROVECOMMISSION, data, { headers });
};
const configcommission = (data = {}, headers = {}) => {
  // console.log("Config commission with:", data);
  return apiClient.post(APIRoutes.CONFIGCOMMISSION, data, { headers });
};
const updateConditionConfig = (data = {}, headers = {}) => {
  // console.log("update Condition Config commission with:", data);
  return apiClient.post(APIRoutes.UPDATECONDITIONCONFIG, data, { headers });
};
const configList = (data = { pageNumber: 0, pageSize: 0 }, headers = {}) => {
  // console.log("config commission list:", data);
  return apiClient.post(APIRoutes.CONFIGLIST, data, { headers });
};
const updateCron = (data = {}, headers = {}) => {
  console.log("config commission cron:", data);
  return apiClient.post(APIRoutes.UPDATECRON, data, { headers });
};
const updateStatus = (data = {}, headers = {}) => {
  console.log("config commission STATUS:", data);
  return apiClient.post(APIRoutes.UPDATESTATUS, data, { headers });
};
const searchFieldsConfig = (data = {}, headers = {}) => {
  // console.log("### search fields:", data);
  // console.log("### search fields headers:", headers);
  return apiClient.get(APIRoutes.COMMISSIONSEARCHFIELDS, {
    params: data,
    headers: headers
  });
};

const editAgentDetails = async (data, sectionName, agentid, headers = {}) => {


  console.log("📝 Edit agent details input:", data, `${APIRoutes.EDITAGENT}/${agentid}/${sectionName}`);
  if (!agentid) {
    throw new Error("Agent ID is required");
  }
  if (!sectionName) {
    throw new Error("Section name is required");
  }

  return apiClient.post(`${APIRoutes.EDITAGENT}/${agentid}/${sectionName}`, data, { headers });

};

const executiveHistoryList = (data = {}, headers = {}) => {
  // console.log("config commission executive history list:", data);
  const { jobConfigId } = data;
  const pathId = jobConfigId;
  if (!pathId) {
    throw new Error("jobConfigId is required for executive history list");
  }
  return apiClient.post(`${APIRoutes.EXECUTIVEHISTORYLIST}/${pathId}`, data, { headers });
};

const editCommission = (data = {}, headers = {}) => {
  const { commissionConfigId } = data;
  const ConfigId = commissionConfigId;
  // console.log("config  Edit commission steps:", data);
  return apiClient.post(`${APIRoutes.UPDATECOMMISSIONBYID}/${ConfigId}`, data, { headers });
};

const downloadRecord = (data = {}, headers = {}) => {
  const { jobExeHistId } = data;
  if (!jobExeHistId) {
    throw new Error("jobExeHistId is required for download record");
  }
  return apiClient.post(`${APIRoutes.DOWNLOADRECORD}/${jobExeHistId}`, data, { headers });
};

const GeoHierarchy = (channelCategory, subChannelCode, branchCode, headers = {}) => {
  if (!channelCategory && !branchCode) {
    throw new Error("channelCategory is required for GeoHierarchy");
  }
  console.log("Fetching GeoHierarchy with channelCategory:", channelCategory, "subChannelCode:", subChannelCode, "branchCode:", branchCode);
  return apiClient.post(APIRoutes.GEOHIERARCHY, { channelCode: channelCategory, subChannelCode: subChannelCode, branchCode: branchCode }, { headers });
};

const GeoHierarchyTable = (parentBranchId, headers = {}) => {
  return apiClient.post(APIRoutes.GEOHIERARCHYTABLE, { parentBranchId: parentBranchId }, { headers });
}

const hmsDashboard = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.HMSDASHBOARD, data, { headers });
}

const getGraphData = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.GETGRAPHDATA, data, { headers });
}

const getChannelStats = (data = {}, headers = {}) => {
  console.log("Fetching channel stats with data:", data);
  console.log("Fetching channel stats with headers:", headers);
  return apiClient.post(APIRoutes.CHANNELSTATS, data, { headers });
}

const uploadFileList = (headers = {}) => {
  console.log("uploadFileList called");
  return apiClient.post(APIRoutes.UPLOADFILELIST, {}, { headers });
}

const downloadReport = (data = {}, headers = {}) => {
  const { id, reportType } = data;
  if (!id || !reportType) {
    throw new Error("reportId and reportType are required for download report");
  }
  return apiClient.post(`${APIRoutes.DOWNLOADREPORT}/${id}/${reportType}`, data, { headers, });
}
const allowUiAccess = (roleId, searchFor, headers = {}) => {
  return apiClient.post(APIRoutes.GETHIERARCHY, { roleId, searchFor }, { headers });
}
const fetchInboxData = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.FETCHINBOX, data, { headers });
}
const updateSrDecision = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.UPDATESRDECISION, data, { headers });
}
const getUserIds = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.GETUSERIDS, data, { headers });
}
const getUserDetails = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.GETUSERDETAILS, data, { headers });
}
const createUser = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.CREATEUSER, data, { headers });
}
const updateUser = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.UPDATEUSER, data, { headers });
}
const updatePassword = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.UPDATEPASSWORD, data, { headers });
}
const activateDeactivateUser = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.ACTIVEDEACTIVEUSER, data, { headers });
}
const lockUnlockUser = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.LOCKUNLOCKUSER, data, { headers });
}
const orgConfiguration = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.ORGCONFIG, data, { headers });
}
const orgConfigUpdate = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.ORGCONFIGUPDATE, data, { headers });
}
const SaveProduct = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.SAVEPRODUCT, data, { headers });
}
const GetProducts = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.GETPRODUCTS, data, { headers });
}
const fetchAllBranches = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.FETCHALLBRANCHES, data, { headers });
};

const saveBranchLinkedAgent = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.SAVEAGENTLINKEDBRANCH, data, { headers });
};

const fetchBranchByAgent = (data = {}, headers = {}) => {
  return apiClient.post(`${APIRoutes.FETCHBRANCHBYAGENT}/${data.agentId}`, {}, { headers });
};

const CreateIndividualAgent = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.CREATEINDIVIDUALAGENT, data, { headers });
};

const saveBranchLinkedUser = (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.SAVEUSERLINKEDBRANCH, data, { headers });
};

const fetchBranchByUser = (data = {}, headers = {}) => {
  return apiClient.post(`${APIRoutes.FETCHBRANCHBYUSER}/${data.userId}`, {}, { headers });
};



const saveCustomField = async (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.SAVECUSTOMFIELD, data, { headers });
};

const getCustomFields = async (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.GETCUSTOMFIELDS, data, { headers });
};

// ─── Incentive: KPI Library ────────────────────────────────────────────────────

const getIncentiveKpiLibrary = async (data = {}, headers = {}) => {
  return apiClient.get(APIRoutes.INCENTIVE_KPI_LIBRARY, { params: data, headers });
};

const getIncentiveKpiById = async (data = {}, headers = {}) => {
  const { id } = data;
  return apiClient.get(`${APIRoutes.INCENTIVE_KPI_LIBRARY}/${id}`, { headers });
};

const createIncentiveKpi = async (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.INCENTIVE_KPI_LIBRARY, data, { headers });
};

const updateIncentiveKpi = async (data = {}, headers = {}) => {
  const { id, ...body } = data;
  return apiClient.put(`${APIRoutes.INCENTIVE_KPI_LIBRARY}/${id}`, body, { headers });
};

const deleteIncentiveKpi = async (data = {}, headers = {}) => {
  const { id } = data;
  return apiClient.delete(`${APIRoutes.INCENTIVE_KPI_LIBRARY}/${id}`, { headers });
};

// ─── Incentive: Filters ────────────────────────────────────────────────────────

const getIncentiveFilters = async (data = {}, headers = {}) => {
  return apiClient.get(APIRoutes.INCENTIVE_FILTERS, { params: data, headers });
};

// ─── Incentive: Programs ──────────────────────────────────────────────────────

const getIncentivePrograms = async (data = {}, headers = {}) => {
  return apiClient.get(APIRoutes.INCENTIVE_PROGRAMS, { params: data, headers });
};

const getIncentiveProgramById = async (data = {}, headers = {}) => {
  const { id } = data;
  return apiClient.get(`${APIRoutes.INCENTIVE_PROGRAMS}/${id}`, { headers });
};

const createIncentiveProgram = async (data = {}, headers = {}) => {
  return apiClient.post(APIRoutes.INCENTIVE_PROGRAMS, data, { headers });
};

const updateIncentiveProgram = async (data = {}, headers = {}) => {
  const { id, ...body } = data;
  return apiClient.put(`${APIRoutes.INCENTIVE_PROGRAMS}/${id}`, body, { headers });
};

const getIncentiveProgramProductWeightage = async (data = {}, headers = {}) => {
  const { id } = data;
  return apiClient.get(`${APIRoutes.INCENTIVE_PROGRAMS}/${id}/product-weightage`, { headers });
};

const saveIncentiveProgramProductWeightage = async (data = {}, headers = {}) => {
  const { id, ...body } = data;
  return apiClient.post(`${APIRoutes.INCENTIVE_PROGRAMS}/${id}/product-weightage`, body, { headers });
};

const verifyOtp = async (data = {}, headers = {}) => {
  const { id, ...body } = data;
  return apiClient.post(`${APIRoutes.VERIFY_OTP}`, body, { headers });
};

const generateOtp = async (data = {}, headers = {}) => {
  const { id, ...body } = data;
  return apiClient.post(`${APIRoutes.GENERATE_OTP}`, body, { headers });
}
module.exports = {
  login,
  search,
  searchbycode,
  loadEncryptionConfig,
  getHRMChunks,
  getChannel,
  Agentbyid,
  AgentByCode,
  GetMasters,
  file,
  userList,
  getRefreshToken,
  getSubChannel,
  createChannel,
  fetchMenu,
  rolesList,
  fetchLocations,
  grantMenu,
  createRole,
  removeUser,
  revokeMenu,
  GetMastersBulk,
  getCommissionData,
  processCommission,
  holdCommission,
  adjustCommission,
  approveCommission,
  configcommission,
  deleteRole,
  getBranchHierarchy,
  savePartner,
  createSubChannel,
  updateConditionConfig,
  configList,
  updateCron,
  saveBranch,
  getPartnerHierarchy,
  addUser,
  saveDesignation,
  updateStatus,
  searchForPartner,
  searchFieldsConfig,
  editAgentDetails,
  executiveHistoryList,
  editCommission,
  getHierarchy,
  fieldUpdate,
  downloadRecord,
  GeoHierarchy,
  saveLocations,
  getDesignationHierarchy,
  GeoHierarchyTable,
  hmsDashboard,
  getGraphData,
  getChannelStats,
  uploadFileList,
  downloadReport,
  allowUiAccess,
  fetchInboxData,
  updateSrDecision,
  getUserIds,
  getUserDetails,
  createUser,
  updateUser,
  updatePassword,
  activateDeactivateUser,
  lockUnlockUser,
  orgConfiguration,
  orgConfigUpdate,
  SaveProduct,
  GetProducts,
  fetchAllBranches,
  saveBranchLinkedAgent,
  fetchBranchByAgent,
  CreateIndividualAgent,
  saveBranchLinkedUser,
  fetchBranchByUser,
  saveCustomField,
  getCustomFields,
  getIncentiveKpiLibrary,
  getIncentiveKpiById,
  createIncentiveKpi,
  updateIncentiveKpi,
  deleteIncentiveKpi,
  getIncentiveFilters,
  getIncentivePrograms,
  getIncentiveProgramById,
  createIncentiveProgram,
  updateIncentiveProgram,
  getIncentiveProgramProductWeightage,
  saveIncentiveProgramProductWeightage,
  verifyOtp,
  generateOtp,
};
