import { callApi } from './apiService'
import { APIRoutes } from './constant'
import type {
  IKpiListParams,
  IKpiListResponse,
  IKpi,
  ICreateKpiRequest,
  IUpdateKpiRequest,
  IIncentiveFiltersParams,
  IBranchDesignations,
  IProgramListParams,
  IProgramListResponse,
  IIncentiveProgram,
  ICreateProgramRequest,
  IUpdateProgramRequest,
  IProductWeightageResponse,
  ISaveProductWeightageRequest,
} from '@/models/incentive'

export const incentiveService = {
  // ─── KPI Library ─────────────────────────────────────────────────────────────

  /** GET /api/incentive/kpi-library — paged KPI list with optional search */
  getKpiLibrary: async (params: IKpiListParams = {}) => {
    try {
      const response = await callApi<IKpiListResponse>(
        APIRoutes.GET_INCENTIVE_KPI_LIBRARY,
        [params],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getKpiLibrary error:', error)
      throw error
    }
  },

  /** GET /api/incentive/kpi-library/{id} — single KPI */
  getKpiById: async (id: string) => {
    try {
      const response = await callApi<IKpi>(
        APIRoutes.GET_INCENTIVE_KPI_BY_ID,
        [{ id }],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getKpiById error:', error)
      throw error
    }
  },

  /** POST /api/incentive/kpi-library — create KPI */
  createKpi: async (data: ICreateKpiRequest) => {
    try {
      const response = await callApi<IKpi>(
        APIRoutes.CREATE_INCENTIVE_KPI,
        [data],
      )
      return response
    } catch (error) {
      console.error('incentiveService.createKpi error:', error)
      throw error
    }
  },

  /** PUT /api/incentive/kpi-library/{id} — update KPI */
  updateKpi: async (data: IUpdateKpiRequest) => {
    try {
      const response = await callApi<IKpi>(
        APIRoutes.UPDATE_INCENTIVE_KPI,
        [data],
      )
      return response
    } catch (error) {
      console.error('incentiveService.updateKpi error:', error)
      throw error
    }
  },

  /** DELETE /api/incentive/kpi-library/{id} — soft-delete KPI */
  deleteKpi: async (id: string) => {
    try {
      const response = await callApi<void>(
        APIRoutes.DELETE_INCENTIVE_KPI,
        [{ id }],
      )
      return response
    } catch (error) {
      console.error('incentiveService.deleteKpi error:', error)
      throw error
    }
  },

  // ─── Filters ─────────────────────────────────────────────────────────────────

  /** GET /api/incentive/filters — cascading filter: multi-branchId → Designations */
  getFilters: async (params: IIncentiveFiltersParams = {}) => {
    try {
      const response = await callApi<IBranchDesignations[]>(
        APIRoutes.GET_INCENTIVE_FILTERS,
        [params],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getFilters error:', error)
      throw error
    }
  },

  // ─── Programs ─────────────────────────────────────────────────────────────────

  /** GET /api/incentive/programs — paged program list */
  getPrograms: async (params: IProgramListParams = {}) => {
    try {
      const response = await callApi<IProgramListResponse>(
        APIRoutes.GET_INCENTIVE_PROGRAMS,
        [params],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getPrograms error:', error)
      throw error
    }
  },

  /** GET /api/incentive/programs/{id} — program with all child mappings */
  getProgramById: async (id: string) => {
    try {
      const response = await callApi<IIncentiveProgram>(
        APIRoutes.GET_INCENTIVE_PROGRAM_BY_ID,
        [{ id }],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getProgramById error:', error)
      throw error
    }
  },

  /** POST /api/incentive/programs — atomic create (program + KPIs + weightages + filters) */
  createProgram: async (data: ICreateProgramRequest) => {
    try {
      const response = await callApi<IIncentiveProgram>(
        APIRoutes.CREATE_INCENTIVE_PROGRAM,
        [data],
      )
      return response
    } catch (error) {
      console.error('incentiveService.createProgram error:', error)
      throw error
    }
  },

  /** PUT /api/incentive/programs/{id} — update program header */
  updateProgram: async (data: IUpdateProgramRequest) => {
    try {
      const response = await callApi<IIncentiveProgram>(
        APIRoutes.UPDATE_INCENTIVE_PROGRAM,
        [data],
      )
      return response
    } catch (error) {
      console.error('incentiveService.updateProgram error:', error)
      throw error
    }
  },

  /** GET /api/incentive/programs/{id}/product-weightage — get product weightages */
  getProductWeightage: async (programId: string) => {
    try {
      const response = await callApi<IProductWeightageResponse>(
        APIRoutes.GET_INCENTIVE_PROGRAM_PRODUCT_WEIGHTAGE,
        [{ id: programId }],
      )
      return response
    } catch (error) {
      console.error('incentiveService.getProductWeightage error:', error)
      throw error
    }
  },

  /** POST /api/incentive/programs/{id}/product-weightage — save/replace product weightages (validates sum = 100%) */
  saveProductWeightage: async (data: ISaveProductWeightageRequest) => {
    try {
      const response = await callApi<IProductWeightageResponse>(
        APIRoutes.SAVE_INCENTIVE_PROGRAM_PRODUCT_WEIGHTAGE,
        [data],
      )
      return response
    } catch (error) {
      console.error('incentiveService.saveProductWeightage error:', error)
      throw error
    }
  },
}
