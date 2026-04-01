import { useRef, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { Label } from '@/components/ui/label'
import Button from '@/components/ui/button'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { code: 'MARUTI_CIAZ', name: 'Maruti Ciaz' },
  { code: 'MARUTI_SWIFT', name: 'Maruti Swift' },
  { code: 'HYUNDAI_I20', name: 'Hyundai i20' },
  { code: 'HONDA_CITY', name: 'Honda City' },
]

// Mock API: one version per product
const MOCK_VERSIONS: Record<string, string> = {
  MARUTI_CIAZ: '2002-2003',
  MARUTI_SWIFT: '2015-2016',
  HYUNDAI_I20: '2018-2019',
  HONDA_CITY: '2016-2017',
}

// Add Product popup: demo product codes and version mapping
const ADD_PRODUCT_CODES = ['P001', 'P002', 'P003']

const ADD_PRODUCT_VERSIONS: Record<string, string> = {
  P001: 'V1',
  P002: 'V2',
  P003: 'V3',
}

// Mock API: table name options
const MOCK_TABLE_NAMES = ['Sales', 'Products', 'Customers', 'Orders', 'Inventory']

// Mock API: column/property options per table
const MOCK_COLUMN_PROPERTIES: Record<string, string[]> = {
  Sales: ['Amount', 'Quantity', 'Discount', 'Tax'],
  Products: ['Price', 'Category', 'Brand', 'Rating'],
  Customers: ['Region', 'Type', 'Tier', 'Credit Score'],
  Orders: ['Status', 'Priority', 'Channel', 'Value'],
  Inventory: ['Stock Level', 'Reorder Point', 'Lead Time', 'Unit Cost'],
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DimensionData {
  tableName: string
  property: string
  rangeFrom: string
  rangeTo: string
  saved: boolean
}

interface DetailRow {
  weightageDetailsId: string
  productCode: string
  version: string
  weightage: number | null
  dimensions: Partial<Record<number, DimensionData>>
}

interface DimModalState {
  rowId: string
  dimensionNo: number
  weightageDetailsId: string
  productCode: string
  version: string
}

// ─── Dimension Modal ──────────────────────────────────────────────────────────

interface DimensionModalProps {
  dimensionNo: number
  initial: DimensionData | null
  onSave: (data: Omit<DimensionData, 'saved'>) => void
  onCancel: () => void
}

const DimensionModal = ({ dimensionNo, initial, onSave, onCancel }: DimensionModalProps) => {
  const [form, setForm] = useState({
    tableName: initial?.tableName ?? '',
    property: initial?.property ?? '',
    rangeFrom: initial?.rangeFrom ?? '',
    rangeTo: initial?.rangeTo ?? '',
  })

  const columnOptions = MOCK_COLUMN_PROPERTIES[form.tableName] ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Dimension {dimensionNo}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Table Name</Label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.tableName}
              onChange={(e) =>
                setForm((f) => ({ ...f, tableName: e.target.value, property: '' }))
              }
            >
              <option value="">Select…</option>
              {MOCK_TABLE_NAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">
              Column/Property
            </Label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              value={form.property}
              disabled={!form.tableName}
              onChange={(e) => setForm((f) => ({ ...f, property: e.target.value }))}
            >
              <option value="">Select…</option>
              {columnOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Range From</Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.rangeFrom}
              onChange={(e) => setForm((f) => ({ ...f, rangeFrom: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Range To</Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.rangeTo}
              onChange={(e) => setForm((f) => ({ ...f, rangeTo: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="green" size="sm" onClick={() => onSave(form)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

interface AddProductForm {
  productCode: string
  version: string
  weightage: string
}

interface AddProductModalProps {
  onSave: (productCode: string, version: string, weightage: number) => void
  onCancel: () => void
}

const AddProductModal = ({ onSave, onCancel }: AddProductModalProps) => {
  const [form, setForm] = useState<AddProductForm>({
    productCode: '',
    version: '',
    weightage: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleProductChange = (code: string) => {
    setForm({ productCode: code, version: ADD_PRODUCT_VERSIONS[code] ?? '', weightage: form.weightage })
    setError(null)
  }

  const handleSave = () => {
    if (!form.productCode) {
      setError('Product Code is required.')
      return
    }
    if (!form.version) {
      setError('Version could not be determined.')
      return
    }
    if (!form.weightage.trim()) {
      setError('Weightage is required.')
      return
    }
    const parsed = parseFloat(form.weightage)
    if (isNaN(parsed)) {
      setError('Weightage must be a valid number.')
      return
    }
    if (parsed < 0 || parsed > 100) {
      setError('Weightage must be between 0 and 100.')
      return
    }
    onSave(form.productCode, form.version, parsed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Add Product</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Product Code</Label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.productCode}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">Select…</option>
              {ADD_PRODUCT_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Version</Label>
            <input
              type="text"
              readOnly
              className="w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 cursor-not-allowed"
              value={form.version}
              placeholder="Auto-fetched on product selection"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Weightage</Label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Enter weightage"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.weightage}
              onChange={(e) => { setForm((f) => ({ ...f, weightage: e.target.value })); setError(null) }}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="green" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DIMENSIONS = Array.from({ length: 10 }, (_, i) => i + 1)

const ProductWeightage = () => {
  // Master form
  const [masterForm, setMasterForm] = useState({ weightName: '', startDate: '', endDate: '' })
  const [weightageId, setWeightageId] = useState<string | null>(null)
  const [masterError, setMasterError] = useState<string | null>(null)

  // Detail rows
  const [detailRows, setDetailRows] = useState<Array<DetailRow>>([])
  const rowCounterRef = useRef(0)

  // Dimension modal
  const [dimModal, setDimModal] = useState<DimModalState | null>(null)

  // Add Product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false)

  // ─── Create Master (mock) ────────────────────────────────────────────────

  const handleCreateMaster = () => {
    const { weightName, startDate, endDate } = masterForm
    if (!weightName.trim() || !startDate || !endDate) {
      setMasterError('All fields (Weight Name, Start Date, End Date) are required.')
      return
    }
    if (endDate < startDate) {
      setMasterError('End Date must be on or after Start Date.')
      return
    }
    setMasterError(null)
    setWeightageId(`WM-${Date.now()}`)
  }

  // ─── Add Detail Row (mock) ───────────────────────────────────────────────

  const handleAddRow = () => {
    if (!weightageId) return
    setShowAddProductModal(true)
  }

  const handleAddProductSave = (productCode: string, version: string, weightage: number) => {
    rowCounterRef.current += 1
    setDetailRows((prev) => [
      ...prev,
      {
        weightageDetailsId: `WD-${rowCounterRef.current}`,
        productCode,
        version,
        weightage,
        dimensions: {},
      },
    ])
    setShowAddProductModal(false)
  }

  // ─── Delete Detail Row (mock) ────────────────────────────────────────────

  const handleDeleteRow = (weightageDetailsId: string) => {
    setDetailRows((prev) => prev.filter((r) => r.weightageDetailsId !== weightageDetailsId))
  }

  // ─── Update Row Field ────────────────────────────────────────────────────

  const updateProductCode = (weightageDetailsId: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((r) => {
        if (r.weightageDetailsId !== weightageDetailsId) return r
        return {
          ...r,
          productCode: value,
          version: MOCK_VERSIONS[value] ?? '',
        }
      }),
    )
  }

  const updateWeightage = (weightageDetailsId: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((r) => {
        if (r.weightageDetailsId !== weightageDetailsId) return r
        let newWeightage: number | null = r.weightage
        if (value === '') {
          newWeightage = null
        } else {
          const parsed = parseFloat(value)
          if (!isNaN(parsed)) newWeightage = parsed
        }
        return { ...r, weightage: newWeightage }
      }),
    )
  }

  // ─── Save Dimension (mock) ───────────────────────────────────────────────

  const handleDimSave = (data: Omit<DimensionData, 'saved'>) => {
    if (!dimModal) return
    const { rowId, dimensionNo } = dimModal
    setDetailRows((prev) =>
      prev.map((r) => {
        if (r.weightageDetailsId !== rowId) return r
        return {
          ...r,
          dimensions: { ...r.dimensions, [dimensionNo]: { ...data, saved: true } },
        }
      }),
    )
    setDimModal(null)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* ── Master Section (Green) ─────────────────────────────────────────── */}
      <div className="rounded-lg border-2 border-green-400 bg-green-50 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">Weight Name</Label>
            <input
              type="text"
              placeholder="Text Box"
              disabled={!!weightageId}
              value={masterForm.weightName}
              onChange={(e) => setMasterForm((f) => ({ ...f, weightName: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-48 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">Start Date</Label>
            <input
              type="date"
              disabled={!!weightageId}
              value={masterForm.startDate}
              onChange={(e) => setMasterForm((f) => ({ ...f, startDate: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-40 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">End Date</Label>
            <input
              type="date"
              disabled={!!weightageId}
              value={masterForm.endDate}
              onChange={(e) => setMasterForm((f) => ({ ...f, endDate: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-40 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          {!weightageId ? (
            <Button variant="green" size="sm" onClick={handleCreateMaster}>
              Create
            </Button>
          ) : (
            <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded px-3 py-1.5">
              ✓ Created (ID: {weightageId})
            </span>
          )}
        </div>
        {masterError && <p className="mt-2 text-xs text-red-600">{masterError}</p>}
      </div>

      {/* ── Details Section (Blue header / Orange rows) ────────────────────── */}
      <div>
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={handleAddRow}
            disabled={!weightageId}
          >
            Add Product
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Product Code
                </th>
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Version
                </th>
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Weightage
                </th>
                {DIMENSIONS.map((d) => (
                  <th
                    key={d}
                    className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap"
                  >
                    Dimension {d}
                  </th>
                ))}
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {detailRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-sm text-neutral-400"
                  >
                    {weightageId
                      ? 'Click "Add Product" to add detail entries.'
                      : 'Create a Weightage Master first.'}
                  </td>
                </tr>
              ) : (
                detailRows.map((row, idx) => (
                  <tr
                    key={row.weightageDetailsId}
                    className={idx % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100'}
                  >
                    <td className="border border-orange-200 px-2 py-1">
                      <select
                        className="w-full rounded border border-orange-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={row.productCode}
                        onChange={(e) =>
                          updateProductCode(row.weightageDetailsId, e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {MOCK_PRODUCTS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-orange-200 px-3 py-2 text-center text-xs">
                      {row.version || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="border border-orange-200 px-2 py-1 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        className="w-16 rounded border border-orange-300 bg-white px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={row.weightage ?? ''}
                        onChange={(e) => updateWeightage(row.weightageDetailsId, e.target.value)}
                      />
                    </td>
                    {DIMENSIONS.map((d) => {
                      const dim = row.dimensions[d]
                      return (
                        <td
                          key={d}
                          className={`border border-orange-200 px-2 py-1 text-center ${dim?.saved ? 'bg-green-100' : ''}`}
                        >
                          {dim?.saved ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-medium text-green-700 leading-tight">
                                {dim.tableName}.{dim.property}
                              </span>
                              {(dim.rangeFrom || dim.rangeTo) && (
                                <span className="text-xs text-green-600 leading-tight">
                                  {dim.rangeFrom} – {dim.rangeTo}
                                </span>
                              )}
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-0.5"
                                onClick={() =>
                                  setDimModal({
                                    rowId: row.weightageDetailsId,
                                    dimensionNo: d,
                                    weightageDetailsId: row.weightageDetailsId,
                                    productCode: row.productCode,
                                    version: row.version,
                                  })
                                }
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                              onClick={() =>
                                setDimModal({
                                  rowId: row.weightageDetailsId,
                                  dimensionNo: d,
                                  weightageDetailsId: row.weightageDetailsId,
                                  productCode: row.productCode,
                                  version: row.version,
                                })
                              }
                            >
                              Click Here
                            </button>
                          )}
                        </td>
                      )
                    })}
                    <td className="border border-orange-200 px-2 py-1 text-center">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 mx-auto"
                        onClick={() => handleDeleteRow(row.weightageDetailsId)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dimension Modal ────────────────────────────────────────────────── */}
      {dimModal && (
        <DimensionModal
          dimensionNo={dimModal.dimensionNo}
          initial={
            detailRows.find((r) => r.weightageDetailsId === dimModal.rowId)?.dimensions[
              dimModal.dimensionNo
            ] ?? null
          }
          onSave={handleDimSave}
          onCancel={() => setDimModal(null)}
        />
      )}

      {/* ── Add Product Modal ──────────────────────────────────────────────── */}
      {showAddProductModal && (
        <AddProductModal
          onSave={handleAddProductSave}
          onCancel={() => setShowAddProductModal(false)}
        />
      )}
    </div>
  )
}

export default ProductWeightage
