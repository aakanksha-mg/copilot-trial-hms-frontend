import React, { useState, useEffect } from 'react'
import { BiUser } from 'react-icons/bi'
import { Card, CardContent } from '../ui/card'
import DynamicFormBuilder from '../form/DynamicFormBuilder'
import type { IAgent, IEditAgentRequest } from '@/models/agent'
import { useAppForm } from '@/components/form'
import { Switch } from '@/components/ui/switch'
import z from 'zod'
import AutoAccordionSection from '../ui/autoAccordianSection'
import { MASTER_DATA_KEYS, NOTIFICATION_CONSTANTS } from '@/utils/constant'
import { useMasterData } from '@/hooks/useMasterData'
import { agentService } from '@/services/agentService'
import { showToast } from '@/components/ui/sonner'
import { useUIAccess } from '@/hooks/uiAccess'
import { HMSService } from '@/services/hmsService'

const formatDateToISO = (dateString: string) => {
  if (!dateString) return null;
  
  // If it's already in the right format, return as is
  if (dateString.includes('T')) return dateString;
  
  // Convert various date formats to YYYY-MM-DD format
  let date;
  
  // Handle format like "02 Jan 2026"
  if (dateString.match(/\d{2} \w{3} \d{4}/)) {
    const parts = dateString.split(' ');
    const day = parts[0];
    const month = new Date(Date.parse(parts[1] + " 1, 2022")).getMonth() + 1; // Convert month name to number
    const year = parts[2];
    date = new Date(`${year}-${month}-${day}`);
  } else {
    // Try to parse as is
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) return dateString; // Return as is if invalid
  
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Get current time
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};


// Helper function to format dates in form data
const formatDatesInFormData = (formData: Record<string, any>, dateFields: string[]) => {
  const formattedData = { ...formData };
  
  dateFields.forEach((field: string) => {
    if (formattedData[field]) {
      formattedData[field] = formatDateToISO(formattedData[field]);
    }
  });
  
  return formattedData;
};



type AgentDetailProps = {
  agent: any
  getOptions: any
  activeTab: string
}

const AgentDetail = ({ agent, getOptions, activeTab }: AgentDetailProps) => {
  const [isEdit, setIsEdit] = useState(false)

  // Get UI access permissions for agent section
  // API expects "Agent" (capitalized) and "Screen" (capitalized)
  const { isFieldVisible, isFieldEditable, isLoading: uiAccessLoading, isSectionVisible } = useUIAccess('Agent', 'Screen')

  // Custom fields fetched from backend (created by admin via RolesManagement > Field tab)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [customFieldsKey, setCustomFieldsKey] = useState(0)

  useEffect(() => {
    HMSService.getCustomFields({ targetScreen: 'Agent', targetTab: activeTab, isActive: true })
      .then((res: any) => {
        const fields: any[] = res?.responseBody?.customFields || []
        setCustomFields(fields)
        if (fields.length > 0) {
          setCustomFieldsKey(k => k + 1)
        }
      })
      .catch((err: any) => {
        console.error('Failed to fetch custom fields:', err)
      })
  }, [activeTab])

  // Returns DynamicFormBuilder-compatible field configs for a given section
  const getCustomFieldsForSection = (sectionName: string) => {
    return customFields
      .filter(f => f.targetSection === sectionName && f.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(f => ({
        name: f.key,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder || '',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard' as const,
        ...(f.options
          ? {
              options: (() => {
                try {
                  return JSON.parse(f.options)
                } catch (e) {
                  console.warn(`Custom field "${f.key}" has invalid options JSON:`, e)
                  return []
                }
              })(),
            }
          : {}),
      }))
  }

  if (!agent) return null

  console.log('agent', agent)

  // Helper function to filter fields based on UI access
  // activeTab is the tab value from index.tsx (e.g., 'personaldetails')
  // field.name is the field identifier
  const filterFields = (fields: any[]) => {
    if (uiAccessLoading) return fields // Return all fields while loading
    
    return fields.map(field => {
      const fieldVisible = isFieldVisible(activeTab, field.name, field.label)
      const fieldEditable = isFieldEditable(activeTab, field.name, field.label)
      
      return {
        ...field,
        // Hide field if not visible, but keep it in the array structure
        // We'll filter it out in the render if needed
        _isVisible: fieldVisible,
        // Update readOnly based on editable permission
        readOnly: !fieldEditable || field.readOnly
      }
    }).filter(field => field._isVisible !== false) // Remove hidden fields
  }

  // Helper function to check if a section should be visible
  // A section is visible if it has at least one visible field
  // configFields: the already-filtered fields array from the config
  // sectionName: the section name for API matching
  const shouldShowSection = (configFields: any[], sectionName: string): boolean => {
    if (uiAccessLoading) return true // Show all sections while loading
    
    // If no visible fields after filtering, hide the section
    if (configFields.length === 0) {
      console.log(`❌ Section "${sectionName}": No visible fields, hiding section`)
      return false
    }
    
    // Also check using isSectionVisible if available (for API-level section checks)
    // Use field names from the filtered fields for the API check
    if (isSectionVisible) {
      const fieldNames = configFields.map(f => f.name)
      const sectionVisible = isSectionVisible(activeTab, sectionName, fieldNames)
      if (!sectionVisible) {
        console.log(`❌ Section "${sectionName}": Not visible according to API, hiding section`)
        return false
      }
    }
    
    return true
  }



  const agentForm = useAppForm({
    defaultValues: {
      // ---- Already existing fields ----
      //Employment details
      agentId: agent.agentId,
      applicationDocketNo: agent.applicationDocketNo,
      agentCode: agent.agentCode,
      candidateType: agent.candidateType,
      agentType: agent.agentType,
      employeeCode: agent.employeeCode,
      startDate: agent.startDate,
      appointmentDate: agent.appointmentDate,
      incorporationDate: agent.incorporationDate,
      agentTypeCat: agent.agentTypeCat,
      agentClass: agent.agentClass,
      cmsAgentType: agent.cmsAgentType,
      agentStatusCode:agent.agentStatusCode,

      title: agent.title,
      firstName: agent.firstName,
      middleName: agent.middleName,
      lastName: agent.lastName,
      agentName: agent.agentName,
      email: agent.email,
      gender: agent.gender,

      nationality: agent.nationality,

      preferredLanguage: agent.preferredLanguage,
      father_Husband_Nm: agent.father_Husband_Nm,

      channel: agent.channel,
      subChannel: agent.subChannel,
      // --- contact DETAILS ---
      mobileNo: agent?.personalInfo?.[0]?.mobileNo,
      workContactNo: agent?.personalInfo?.[0]?.workContactNo,
      // --- EMPLOYMENT DETAILS ---



      pob: agent.pob,
      aadharNumber: agent.aadharNumber,
      education: agent.education,
      educationSpecialization: agent.educationSpecialization,
      educationalInstitute: agent.educationalInstitute,
      passingYear: agent.passingYear,
      criminalRecord: agent.criminalRecord,
      employmentType: agent.employmentType,
      employmentStatus: agent.employmentStatus,
      experienceYears: agent.experienceYears,
      uanNumber: agent.uanNumber,
      reportingToName: agent.reportingToName,
      reportingToDesignation: agent.reportingToDesignation,

      // --- CHANNEL DETAILS ---
      channelRegion: agent.channelRegion,
      commissionClass: agent.commissionClass,
      locationCode:agent.locationCode,
      cluster: agent.cluster,
      branchCode: agent.branchCode,
      baseLocation: agent.baseLocation,
      zone: agent.zone,
      irdaTrainingOrganization: agent.irdaTrainingOrganization,

      // --- HIERARCHY ---
      rmName: agent.rmName,
      rmMobile: agent.rmMobile,
      rmEmail: agent.rmEmail,
      smName: agent.smName,
      smMobile: agent.smMobile,
      smEmail: agent.smEmail,
      asmName: agent.asmName,
      asmMobile: agent.asmMobile,
      asmEmail: agent.asmEmail,
      branchManagerMobile: agent.branchManagerMobile,
      branchManagerEmail: agent.branchManagerEmail,

      // --- OTHER PERSONAL INFO ---
      religion: agent.religion,
      caste: agent.caste,
      physicallyChallenged: agent.physicallyChallenged,

      // --- FINANCIAL DETAILS ---
      panAadharLinkFlag: agent.panAadharLinkFlag,
      sec206abFlag: agent.sec206abFlag,
      taxStatus: agent.taxStatus,
      serviceTaxNo: agent.serviceTaxNo,
      //Acct Activation Date missing
      factoringHouse: agent.bankAccounts?.[0]?.factoringHouse,
      accountHolderName: agent.bankAccounts?.[0]?.accountHolderName,
      panNumber: agent.personalInfo?.[0]?.panNumber,
      bankName: agent.bankAccounts?.[0]?.bankName,
      branchName: agent.bankAccounts?.[0]?.branchName,
      accountNumber: agent.bankAccounts?.[0]?.accountNumber,
      accountType: agent.bankAccounts?.[0]?.accountType,
      micr: agent.bankAccounts?.[0]?.micr,
      ifsc: agent.bankAccounts?.[0]?.ifsc,
      preferredPaymentMode: agent.bankAccounts?.[0]?.preferredPaymentMode,

      // --- Other Personal Details ---
      dateOfBirth: agent.personalInfo?.[0]?.dateOfBirth,
      martialStatus: agent.martialStatus,

      educationLevel: agent.educationLevel,
      workProfile: agent.workProfile,
      annualIncome: agent.annualIncome,
      nomineeName: agent.nomineeName,
      relationship: agent.relationship,
      nomineeAge: agent.nomineeAge,
      occupation: agent.occupation,
      urn: agent.urn,
      additionalComment: agent.additionalComment,
      workExpMonths: agent.personalInfo?.[0]?.workExpMonths,
      bloodGroup: agent.personalInfo?.[0]?.bloodGroup,
      birthPlace: agent.personalInfo?.[0]?.birthPlace,

      // --- ADDRESS INFO ---
      stateEid: agent.stateEid,
      addressType: agent?.permanentAddres?.[0]?.addressType,
      addressLine1: agent?.permanentAddres?.[0]?.addressLine1,
      addressLine2: agent?.permanentAddres?.[0]?.addressLine2,
      addressLine3: agent?.permanentAddres?.[0]?.addressLine3,
      city: agent?.permanentAddres?.[0]?.city,
      state: agent?.permanentAddres?.[0]?.state,
      // country: agent?.permanentAddres?.[0].country,
      country: agent?.country,
      pin: agent?.permanentAddres?.[0]?.pin,
    },

    onSubmit: async ({ value }) => {
      console.log('Updated agent:', value)
    },
  })

  const handleFieldClick = () => {
    alert('cancel')
  }

  const agentChannelConfig = {
    gridCols: 2,
    sectionName: 'individual_agent_action',

    defaultValues: {
      channel: agent.channel,
      subChannel: agent.subChannel,
      commissionClass: agent.commissionClass ?? 'N/A',
      designationCode: agent.designationCode,
      locationCode:agent.locationCode ?? "N/A",
      agentStatusCodeId:agent.agentStatusCodeId ?? "N/A",

    },


    schema: z.object({
      channel: z.any().optional(),
      subChannel: z.any().optional(),
      commissionClass: z.any().optional(),
      locationCode: z.any().optional(),
      designationCode: z.any().optional(),
      agentStatusCodeId: z.any().optional(),
    }),

    fields: filterFields([
      {
        name: 'agentStatusCodeId',
        label: 'Status',
        type: 'select',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'custom',
        options: getOptions(MASTER_DATA_KEYS.AGENT_STATUS_CODE),
      },
      {
        name: 'channel',
        label: 'Channel Name',
        type: 'select',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'custom',
        options: getOptions(MASTER_DATA_KEYS.CHANNEL),
      },
      {
        name: 'subChannel',
        label: 'Sub Channel',
        type: 'select',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'custom',
        options: getOptions(MASTER_DATA_KEYS.SUB_CHANNELS),
      },
      {
        name: 'locationCode',
        label: 'Location',
        type: 'select',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'custom',
        options: getOptions(MASTER_DATA_KEYS.Office_Type),
      },
      {
        name: 'designationCode',
        label: 'Designation',
        type: 'select',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'custom',
        options: getOptions(MASTER_DATA_KEYS.DESIGNATION),
      },
      ...getCustomFieldsForSection('individual_agent_action'),
    ]),

    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Changes',
              type: 'submit',
              variant: 'orange',
              colSpan: 2,
              size: 'lg',
              className: 'mt-4',
            },
          ],
        }
      : null,
  }

  const handleSectionSubmit =
    (sectionName: string) => async (formData: Record<string, any>) => {
      console.log(`📝 Submitting ${sectionName}:`, formData)

      try {
        // Extract agentId from agent object (convert to lowercase for backend)
        const agentid = agent?.agentId || agent?.agentid
        if (!agentid) {
          throw new Error('Agent ID is missing. Cannot update agent details.')
        }

        const dateFieldsBySection: Record<string, string[]> = {
          'employee_info': ['startDate', 'appointmentDate', 'incorporationDate'],
          'other_personal_details': ['dateOfBirth'],
          'financial_details': [], // Add any date fields in financial details if needed
          'contact_information': [], // Add any date fields in contact information if needed
          'personal_details': [], // Add any date fields in personal details if needed
          'address_info': [], // Add any date fields in address info if needed
          'individual_agent_action': [] // Add any date fields in agent channel config if needed
        };

         // Format dates in the form data
        const formattedPayload = formatDatesInFormData(
          formData, 
          dateFieldsBySection[sectionName] || []
        );


        const payload = {
          ...formattedPayload,
        } as IEditAgentRequest

        console.log('📤 Sending payload:', payload)
   
        const response = await agentService.editAgent(payload, sectionName, agentid)
        console.log('✅ Update successful:', response)

        // You can add success notification here
        showToast(NOTIFICATION_CONSTANTS.SUCCESS, `${sectionName} updated successfully!`)
        setIsEdit(false) // Exit edit mode after successful save

        return response
      } catch (error) {
        console.error(`❌ Error updating ${sectionName}:`, error)
        showToast(NOTIFICATION_CONSTANTS.ERROR, `Failed to update ${sectionName}. Please try again.`)
        throw error // Re-throw to let the form handle the error state
      }
    }

  const PersonalDetailsConfig = {
    gridCols: 3,
    sectionName: 'personal_details',

    defaultValues: {
      title: agent.title,
      firstName: agent.firstName,
      middleName: agent.middleName,
      lastName: agent.lastName,
      father_Husband_Nm: agent.father_Husband_Nm ?? 'N/a',
      gender: agent.gender,
    },

    schema: z.object({
      title: z.string().optional(),
      firstName: z.string().optional(),
      middleName: z.string().optional(),
      lastName: z.string().optional(),
      father_Husband_Nm: z.string().optional(),
      gender: z.string().optional(),
    }),

    fields: filterFields([
      {
        name: 'title',
        label: 'Title',
        type: 'select',
        options: getOptions(MASTER_DATA_KEYS.SALUTATION),
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'middleName',
        label: 'Middle Name',
        type: 'text',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'father_Husband_Nm',
        label: 'Father/Husband Name',
        type: 'text',
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'gender',
        label: 'Agent Gender',
        type: 'select',
        options: getOptions(MASTER_DATA_KEYS.GENDER),
        colSpan: 1,
        readOnly: !isEdit,
        variant: 'standard',
      },
      ...getCustomFieldsForSection('personal_details'),
    ]),

    buttons: isEdit
      ? {
          gridCols: 6,
          items: [
            {
              label: 'Save Changes',
              type: 'submit',
              variant: 'orange',
              colSpan: 2,
              size: 'md',
              className: 'whitespace-nowrap, mt-4',
            },
          ],
        }
      : null,
  }

  // ne
  const contactInformationConfig = {
    gridCols: 12,
    sectionName: 'contact_information',

    defaultValues: {
      mobileNo: agent?.personalInfo?.[0]?.mobileNo,
      residenceContactNo: agent?.personalInfo?.[0]?.residenceContactNo,
      workContactNo: agent?.personalInfo?.[0]?.workContactNo,
      email: agent?.personalInfo?.[0]?.email,
      cnctPersonName: agent.cnctPersonName,
      cnctPersonMobileNo: agent.cnctPersonMobileNo,
      cnctPersonEmail: agent.cnctPersonEmail,
      cnctPersonDesig: agent.cnctPersonDesig,
    },
    schema: z.object({
      mobileNo: z.string().optional(),
      residenceContactNo: z.string().optional(),
      workContactNo: z.string().optional(),
      email: z.string().optional(),
      cnctPersonName: z.string().optional(),
      cnctPersonMobileNo: z.string().optional(),
      cnctPersonEmail: z.string().optional(),
      cnctPersonDesig: z.string().optional(),
    }),

    fields: filterFields([
      // ROW 1
      {
        name: 'mobileNo',
        label: 'Mobile Phone No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'residenceContactNo',
        label: 'Home Phone No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'workContactNo',
        label: 'Work Phone No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      // ROW 2
      {
        name: 'email',
        label: 'Email ID',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'cnctPersonName',
        label: 'Contact Person Name',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'cnctPersonMobileNo',
        label: 'Contact Person Mobile No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      // ROW 3
      {
        name: 'cnctPersonEmail',
        label: 'Contact Person Email',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'cnctPersonDesig',
        label: 'Contact Person Designation',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      ...getCustomFieldsForSection('contact_information'),
    ]),

    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Changes',
              type: 'submit',
              variant: 'orange',
              colSpan: 2,
              size: 'lg',
              className: 'mt-4',
            },
          ],
        }
      : null,
  }

  const employeeInformationConfig = {
    gridCols: 12,
    sectionName: 'employee_info',

    // DEFAULT VALUES
    defaultValues: {
      agentId: agent.agentId,
      applicationDocketNo: agent.applicationDocketNo ?? 'N/A',
      agentCode: agent.agentCode,
      candidateType: agent.candidateType,
      agentType: agent.agentType,
      employeeCode: agent.employeeCode ?? 'N/A',
      startDate: agent.startDate,
      appointmentDate: agent.appointmentDate,
      incorporationDate: agent.incorporationDate,
      agentTypeCat: agent.agentTypeCat,
      agentClass: agent.agentClass,
      cmsAgentType: agent.cmsAgentType,
    },
    // ZOD SCHEMA
    schema: z.object({
      channelType: z.string().optional(),
      agentId: z.string().optional(),
      applicationDocketNo: z.string().optional(),
      agentCode: z.string().optional(),
      candidateType: z.union([z.string(), z.number()]).optional(),
      agentType: z.union([z.string(), z.number()]).optional(),
      employeeCode: z.union([z.string(), z.number()]).optional(),
      startDate: z.string().optional(),
      appointmentDate: z.string().optional(),
      incorporationDate: z.string().optional(),
      agentTypeCat: z.union([z.string(), z.number()]).optional(),
      agentClass: z.union([z.string(), z.number()]).optional(),
      cmsAgentType: z.string().optional(),
    }),

    // FIELDS
    fields: filterFields([
      {
        name: 'agentId',
        label: 'Agent ID',
        type: 'text',
        colSpan: 4,
        readOnly: true,
        variant: 'standard',
      },
      {
        name: 'applicationDocketNo',
        label: 'Application Docket No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'agentCode',
        label: 'Agent Code',
        type: 'text',
        colSpan: 4,
        readOnly: true,
        variant: 'standard',
      },

      {
        name: 'candidateType',
        label: 'Candidate Type',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.CANDIDATE_TYPE),
      },
      {
        name: 'agentType',
        label: 'Agent Type',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.AGENT_TYPE),
      },
      {
        name: 'employeeCode',
        label: 'Employee Code',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'appointmentDate',
        label: 'Appointment Date',
        type: 'date',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'incorporationDate',
        label: 'Incorporation Date',
        type: 'date',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'agentTypeCat',
        label: 'Agent Type Category',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.AGENT_TYPE_CATEGORY),
      },
      {
        name: 'agentClass',
        label: 'Agent Classification',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.AGENT_CLASS),
      },
      {
        name: 'cmsAgentType',
        label: 'CMS Agent Type',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      // {
      //   name: 'createUpdateResponseDescription',
      //   label: 'Create/Update Agent API Response Description',
      //   type: 'textarea',
      //   colSpan: 12,
      //   variant:"white",
      // },
      ...getCustomFieldsForSection('employee_info'),
    ]),
    // BUTTONS

    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Channel Info',
              type: 'submit',
              variant: 'orange',
              colSpan: 4,
              size: 'md',
              className: 'whitespace-nowrap, mt-4',
            },
          ],
        }
      : null,
  }

  const financialDetailsConfig = {
    gridCols: 12,
    sectionName: 'financial_details',

    // DEFAULT VALUES
    defaultValues: {
      panAadharLinkFlag: agent.panAadharLinkFlag,
      sec206abFlag: agent.sec206abFlag,
      taxStatus: agent.taxStatus ?? 'N/A',
      serviceTaxNo: agent.serviceTaxNo,
      //Acct Activation Date missing
      factoringHouse: agent.bankAccounts?.[0]?.factoringHouse,
      accountHolderName: agent.bankAccounts?.[0]?.accountHolderName,
      panNumber: agent.personalInfo?.[0]?.panNumber,
      bankName: agent.bankAccounts?.[0]?.bankName,
      branchName: agent.bankAccounts?.[0]?.branchName,

      accountNumber: agent.bankAccounts?.[0]?.accountNumber,
      accountType: agent.bankAccounts?.[0]?.accountType,
      micr: agent.bankAccounts?.[0]?.micr,
      ifsc: agent.bankAccounts?.[0]?.ifsc,
      preferredPaymentMode: agent.bankAccounts?.[0]?.preferredPaymentMode,
    },
    // SCHEMA
    schema: z.object({
      taxStatus: z.string().optional(),
      panAadharLinkFlag: z.string().optional(),
      sec206abFlag: z.string().optional(),
      serviceTaxNo: z.string().optional(),
      //Acct Activation Date missing
      factoringHouse: z.string().optional(),
      accountHolderName: z.string().optional(),
      panNumber: z.string().optional(),
      bankName: z.string().optional(),
      branchName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountType: z.string().optional(),
      micr: z.string().optional(),
      ifsc: z.string().optional(),
      preferredPaymentMode: z.string().optional(),
    }),

    // FIELDS
    fields: filterFields([
      {
        name: 'panAadharLinkFlag',
        label: 'Pan Aadhar Link Flag',
        type: 'boolean',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'sec206abFlag',
        label: 'Sec 206ab Flag',
        type: 'boolean',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'taxStatus',
        label: 'Tax Status',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'serviceTaxNo',
        label: 'Service Tax No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      // {
      //   name: 'acctActivationDate',
      //   label: 'Acct Activation Date',
      //   type: 'date',
      //   colSpan: 4,
      // readOnly: !isEdit,
      //   variant: 'standard',
      // },
      {
        name: 'factoringHouse',
        label: 'Factoring House',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'accountHolderName',
        label: 'Payee Name',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'panNumber',
        label: 'PAN No',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'bankName',
        label: 'Bank Name',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'branchName',
        label: 'Bank Branch Name',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'accountNumber',
        label: 'Bank Account No',
        type: 'masked',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'accountType',
        label: 'Bank Account Type',
        type: 'select',
        options: getOptions(MASTER_DATA_KEYS.BANK_ACC_TYPE),
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'micr',
        label: 'MICR Code',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'ifsc',
        label: 'IFSC Code',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'preferredPaymentMode',
        label: 'Payment Mode',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.PAYMENT_MODE),
      },
      ...getCustomFieldsForSection('financial_details'),
    ]),

    // BUTTONS
    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Financial Details',
              type: 'submit',
              variant: 'orange',
              colSpan: 4,
              size: 'md',
              className: 'whitespace-nowrap, mt-4',
            },
          ],
        }
      : null,
  }

  const otherPersonalDetailsConfig = {
    gridCols: 12,
    sectionName: 'other_personal_details',

    // -----------------------------------------
    // DEFAULT VALUES
    // -----------------------------------------
    defaultValues: {
      dateOfBirth: agent.personalInfo?.[0]?.dateOfBirth,
      maritalStatus: agent.maritalStatus,
      education: agent.education,
      workProfile: agent.personalInfo?.[0]?.workProfile,
      annualIncome: agent.personalInfo?.[0]?.annualIncome,
      nomineeName: agent.nominees?.[0]?.nomineeName,
      relationship: agent.nominees?.[0]?.relationship,
      nomineeAge: agent.nominees?.[0]?.nomineeAge,
      occupation: agent.occupation,
      urn: agent.urn ?? 'N/A',
      additionalComment: agent.additionalComment,
      // workExpMonths: agent.personalInfo?[0]?.workExpMonths,
      bloodGroup: agent.personalInfo?.[0]?.bloodGroup,
      birthPlace: agent.personalInfo?.[0]?.birthPlace,
    },

    // -----------------------------------------
    // SCHEMA
    // -----------------------------------------
    schema: z.object({
      dateOfBirth: z.string().optional(),
      maritalStatus: z.union([z.string(), z.number()]).optional(),
      education: z.union([z.string(), z.number()]).optional(),
      workProfile: z.string().optional(),
      annualIncome: z.string().optional(),
      nomineeAge: z.string().optional(),
      nomineeName: z.string().optional(),
      relationship: z.string().optional(),
      occupation: z.union([z.string(), z.number()]).optional(),
      urn: z.string().optional(),
      additionalComment: z.string().optional(),
      // workExpMonths: z.string().optional(),
      bloodGroup: z.string().optional(),
      birthPlace: z.string().optional(),
    }),

    // -----------------------------------------
    // FIELDS
    // -----------------------------------------
    fields: filterFields([
      {
        name: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'maritalStatus',
        label: 'Marital Status',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.MARITAL_STATUS),
      },

      {
        name: 'education',
        label: 'Education Level',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.EDUCATION_QUALIFICATION),
      },
      {
        name: 'workProfile',
        label: 'Work Profile',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'annualIncome',
        label: 'Annual Income',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'nomineeName',
        label: 'Nominee Name',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'relationship',
        label: 'Nominee Relation',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'nomineeAge',
        label: 'Nominee Age',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'occupation',
        label: 'Occupation',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        // variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.OCCUPATIONS),
      },

      {
        name: 'urn',
        label: 'URN',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'additionalComment',
        label: 'Additional Comment',
        type: 'textarea',
        colSpan: 12,
        variant: 'white',
      },
      // {
      //   name: 'workExperience',
      //   label: 'Work Experience',
      //   type: 'text',
      //   colSpan: 4,
      //   readOnly: !isEdit,
      //   variant: 'standard',
      // },
      {
        name: 'bloodGroup',
        label: 'Blood Group',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'birthPlace',
        label: 'Birth Place',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      ...getCustomFieldsForSection('other_personal_details'),
    ]),
    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Details',
              type: 'submit',
              variant: 'orange',
              colSpan: 4,
              size: 'md',
              className: 'whitespace-nowrap, mt-4',
            },
          ],
        }
      : null,
  }

  const addressConfig = {
    gridCols: 12,
    sectionName: 'address_info',

    defaultValues: {
      stateEid: agent.stateEid,
      addressType: agent?.permanentAddres?.[0]?.addressType,
      addressLine1: agent.permanentAddres?.[0]?.addressLine1,
      addressLine2: agent.permanentAddres?.[0]?.addressLine2,
      addressLine3: agent.permanentAddres?.[0]?.addressLine3,
      city: agent.permanentAddres?.[0]?.city,
      state: agent.permanentAddres?.[0]?.state,
      pin: agent.permanentAddres?.[0]?.pin,
      country: agent.country,
    },

    schema: z.object({
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      addressLine3: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      stateEid: z.string().optional(),
      state: z.string().optional(),
      pin: z.string().optional(),
      country: z.string().optional(),
      addressType: z.string().optional(),
    }),

    fields: filterFields([
      {
        name: 'addressType',
        label: 'Address Type',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.ADDRESS_TYPE),
      },
      {
        name: 'addressLine1',
        label: 'Address 1',
        type: 'text',
        colSpan: 4,
        variant: 'standard',
      },
      {
        name: 'addressLine2',
        label: 'Address 2',
        type: 'text',
        colSpan: 4,
        variant: 'standard',
      },
      {
        name: 'addressLine3',
        label: 'Address 3',
        type: 'text',
        colSpan: 4,
        variant: 'standard',
      },

      {
        name: 'city',
        label: 'City',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      {
        name: 'state',
        label: 'State',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
         options: getOptions(MASTER_DATA_KEYS.STATE),
      },

      {
        name: 'stateEid',
        label: 'StateEid',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },

      {
        name: 'country',
        label: 'Country',
        type: 'select',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
        options: getOptions(MASTER_DATA_KEYS.COUNTRY),
      },
      {
        name: 'pin',
        label: 'PIN Code',
        type: 'text',
        colSpan: 4,
        readOnly: !isEdit,
        variant: 'standard',
      },
      ...getCustomFieldsForSection('address_info'),
    ]),

    buttons: isEdit
      ? {
          gridCols: 4,
          items: [
            {
              label: 'Save Address',
              type: 'submit',
              variant: 'orange',
              colSpan: 4,
              size: 'md',
              className: 'whitespace-nowrap, mt-4',
            },
          ],
        }
      : null,
  }

  const f = agentForm as any

  if (!agent) {
    return <div className="p-10 text-red-600">Agent not found</div>
  }
  return (
    <div className="bg-white p-10">
      <div className="mb-6">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 font-poppins font-semibold text-[20px]">
            Individual Agent Action
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">Edit</span>
            <Switch
              checked={isEdit}
              onCheckedChange={setIsEdit}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </div>
        {/* -----------1st part------------------- */}

        <div className="flex gap-10">
          {/* Left Column - Agent Profile */}
          <Card className="bg-white w-lg bg-[#F2F2F7] !rounded-sm">
            <CardContent>
              <div className="flex flex-col items-center text-center">
                {/* Profile Image */}
                <img
                  src="/person.jpg"
                  // src="/api/placeholder/300/300"
                  alt="Agent Profile"
                  className="aspect-3/2 object-cover mb-3 h-[12rem] rounded-lg"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwMCAyMDBDMTAwIDE3Mi4zODYgMTIyLjM4NiAxNTAgMTUwIDE1MFMyMDAgMTcyLjM4NiAyMDAgMjAwVjIyMEgxMDBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                  }}
                />

                {/* Agent Info Card */}
                <div className="bg-orange-400 text-white rounded-lg p-3 w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <BiUser className="h-8 w-8 text-white" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">
                        {agent.agentName}
                      </h3>
                      <p className="text-orange-100 text-sm">
                        AGENT CODE - {agent.agentCode}
                      </p>
                      <p className="text-orange-100 text-sm">
                        DESIGNATION  - {agent.designationCodeDesc ?? "N/A"}
                      </p>
                      <p className="text-orange-100 text-sm flex items-center gap-2">
                        STATUS -{' '}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs text-black font-medium ${
                            !agent.agentStatusCode
                              ? 'bg-gray-200'
                              : String(agent.agentStatusCode).toUpperCase() === 'ACTIVE'
                                ? 'bg-emerald-400/90'
                                : String(agent.agentStatusCode).toUpperCase() === 'TERMINATED'
                                  ? 'bg-red-500/90'
                                  : 'bg-gray-400'
                          }`}
                        >
                          {agent.agentStatusCode ?? 'N/A'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>{' '}
          </Card>

          {shouldShowSection(agentChannelConfig.fields, agentChannelConfig.sectionName) && (
            <Card className="flex justify-center items-center bg-white w-full  !m-0  p-4 w-[100%] !rounded-sm overflow-y-auto bg-[#F2F2F7] w-[100%]">
              <CardContent className="w-[100%] p-0">
                <DynamicFormBuilder
                  key={`individual_agent_action-${customFieldsKey}`}
                  config={agentChannelConfig}
                  onSubmit={handleSectionSubmit(agentChannelConfig.sectionName)}
                  onFieldClick={handleFieldClick}
                />

                {/* some form inputs here */}
              </CardContent>
            </Card>
          )}
        </div>

        {/* --------------Personal Details----------------- */}

        {shouldShowSection(PersonalDetailsConfig.fields, PersonalDetailsConfig.sectionName) && (
          <>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold text-gray-900 mt-6 font-poppins font-semibold text-[20px]">
                Personal Details
              </h2>
            </div>
            <div className="flex gap-2">
              <Card className="w-full !px-6 mt-5 overflow-y-auto overflow-x-hidden w-[100%]  bg-[#F2F2F7]">
                <CardContent className="!px-0 !py-0 w-[100%]">
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`personal_details-${customFieldsKey}`}
                      config={PersonalDetailsConfig}
                      onSubmit={handleSectionSubmit(
                        PersonalDetailsConfig.sectionName,
                      )}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* --------------Contact Information----------------- */}

        {shouldShowSection(contactInformationConfig.fields, contactInformationConfig.sectionName) && (
          <>
            <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
              Contact Information
            </h2>
            <div className="flex gap-2">
              <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
                <CardContent>
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`contact_information-${customFieldsKey}`}
                      config={contactInformationConfig}
                      onSubmit={handleSectionSubmit(
                        contactInformationConfig.sectionName,
                      )}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {/* -------------------hirarchy Information Config------------------------------- */}

        {/* <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
          Hierarchy Information
        </h2>
        <div className="flex gap-2">
          <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
            <CardContent>
              <AutoAccordionSection title="Agent Basic Info" id="sec-1">
                <DynamicFormBuilder
                  config={hierarchyInformationConfig}
                  onSubmit={agentForm.handleSubmit}
                />
              </AutoAccordionSection>
           
            </CardContent>
          </Card>
        </div> */}

        {/* -------------------employee Information Config------------------------------- */}

        {shouldShowSection(employeeInformationConfig.fields, employeeInformationConfig.sectionName) && (
          <>
            <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
              Employee Information Config
            </h2>
            <div className="flex gap-2">
              <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
                <CardContent>
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`employee_info-${customFieldsKey}`}
                      config={employeeInformationConfig}
                      onSubmit={handleSectionSubmit(
                        employeeInformationConfig.sectionName,
                      )}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {/* ---------------financialDetailsConfig--------------- */}
        {shouldShowSection(financialDetailsConfig.fields, financialDetailsConfig.sectionName) && (
          <>
            <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
              Financial Details
            </h2>
            <div className="flex gap-2">
              <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
                <CardContent>
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`financial_details-${customFieldsKey}`}
                      config={financialDetailsConfig}
                      onSubmit={handleSectionSubmit(
                        financialDetailsConfig.sectionName,
                      )}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {/*  Other Personal Details Config */}
        {shouldShowSection(otherPersonalDetailsConfig.fields, otherPersonalDetailsConfig.sectionName) && (
          <>
            <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
              Other Personal Details
            </h2>
            <div className="flex gap-2">
              <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
                <CardContent>
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`other_personal_details-${customFieldsKey}`}
                      config={otherPersonalDetailsConfig}
                      onSubmit={handleSectionSubmit(
                        otherPersonalDetailsConfig.sectionName,
                      )}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* addressConfig */}
        {shouldShowSection(addressConfig.fields, addressConfig.sectionName) && (
          <>
            <h2 className="text-xl mt-6 font-semibold text-gray-900 font-poppins font-semibold !text-[20px]">
              Address
            </h2>
            <div className="flex gap-2">
              <Card className="bg-white !px-1 w-full mt-5 overflow-y-auto bg-[#F2F2F7]">
                <CardContent>
                  <AutoAccordionSection id="sec-1">
                    <DynamicFormBuilder
                      key={`address_info-${customFieldsKey}`}
                      config={addressConfig}
                      onSubmit={handleSectionSubmit(addressConfig.sectionName)}
                    />
                  </AutoAccordionSection>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AgentDetail
