// ─── KPI Library ─────────────────────────────────────────────────────────────

export interface IKpiDataSource {
  object: string
  aggregation: string
  field: string
}

export interface IKpi {
  id: string
  name: string
  description: string
  dataSources: IKpiDataSource[]
  groupBy: string[]
  timeWindow: string
  isDeleted?: boolean
  createdAt: string
  createdBy: string
}

export interface IKpiListParams {
  search?: string
  pageNumber?: number
  pageSize?: number
}

export interface IKpiListResponse {
  items: IKpi[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface ICreateKpiRequest {
  name: string
  description: string
  dataSources: IKpiDataSource[]
  groupBy: string[]
  timeWindow: string
}

export interface IUpdateKpiRequest extends ICreateKpiRequest {
  id: string
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface IDesignation {
  id: string
  name: string
}

export interface IBranchDesignations {
  branchId: string
  branchName: string
  designations: IDesignation[]
}

export interface IIncentiveFiltersParams {
  branchIds?: string[]
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export interface IProgramFilter {
  branchId: string
  designationIds: string[]
}

export interface IProgramKpiWeightage {
  kpiId: string
  weight: number
}

export interface IIncentiveProgram {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  status: string
  filters?: IProgramFilter[]
  kpiWeightages?: IProgramKpiWeightage[]
  createdAt?: string
  createdBy?: string
}

export interface IProgramListParams {
  search?: string
  pageNumber?: number
  pageSize?: number
  status?: string
}

export interface IProgramListResponse {
  items: IIncentiveProgram[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface ICreateProgramRequest {
  name: string
  description?: string
  startDate: string
  endDate: string
  filters: IProgramFilter[]
  kpiWeightages: IProgramKpiWeightage[]
  productWeightages?: IProductWeightageItem[]
}

export interface IUpdateProgramRequest {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
}

// ─── Product Weightage ────────────────────────────────────────────────────────

export interface IProductWeightageItem {
  productCode: string
  productName: string
  weight: number
}

export interface IProductWeightageResponse {
  programId: string
  weightages: IProductWeightageItem[]
}

export interface ISaveProductWeightageRequest {
  id: string
  weightages: IProductWeightageItem[]
}

// ─── Weightage Master ─────────────────────────────────────────────────────────

export interface ICreateWeightageMasterRequest {
  weightName: string
  startDate: string
  endDate: string
}

export interface ICreateWeightageMasterResponse {
  weightageId: string
}

// ─── Weightage Details ────────────────────────────────────────────────────────

export interface ICreateWeightageDetailsRequest {
  weightageId: string
}

export interface ICreateWeightageDetailsResponse {
  weightageDetailsId: string
}

export interface IDeleteWeightageDetailsRequest {
  weightageDetailsId: string
}

// ─── Weightage Dimension ──────────────────────────────────────────────────────

export interface ISaveWeightageDimensionRequest {
  weightageDetailsId: string
  productCode: string
  version: string
  dimensionNo: number
  tableName: string
  property: string
  rangeFrom: string
  rangeTo: string
}
