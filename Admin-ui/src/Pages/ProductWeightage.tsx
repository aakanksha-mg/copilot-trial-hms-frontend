import { useState } from 'react'
import { FiEdit2, FiPlus, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeightageRecord {
  id: string
  weightageName: string
  productCode: string
  createdBy: string
  isActive: boolean
  createdAt: string
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const MOCK_WEIGHTAGES: WeightageRecord[] = [
  {
    id: '1',
    weightageName: 'Term Life Standard',
    productCode: 'TL-001',
    createdBy: 'Manish Kumar',
    isActive: true,
    createdAt: '2024-11-10',
  },
  {
    id: '2',
    weightageName: 'Endowment Premium',
    productCode: 'EP-002',
    createdBy: 'Aakanksha M',
    isActive: true,
    createdAt: '2024-10-25',
  },
  {
    id: '3',
    weightageName: 'ULIP Growth',
    productCode: 'UL-003',
    createdBy: 'Rajan Singh',
    isActive: false,
    createdAt: '2024-09-15',
  },
  {
    id: '4',
    weightageName: 'Critical Illness Add-On',
    productCode: 'CI-004',
    createdBy: 'Priya Nair',
    isActive: true,
    createdAt: '2024-08-30',
  },
]

// ─── Modal Form Component ─────────────────────────────────────────────────────

interface WeightageFormProps {
  initial: Omit<WeightageRecord, 'id' | 'createdAt'> | null
  onSave: (data: Omit<WeightageRecord, 'id' | 'createdAt'>) => void
  onCancel: () => void
  isEdit: boolean
}

const WeightageForm = ({ initial, onSave, onCancel, isEdit }: WeightageFormProps) => {
  const [form, setForm] = useState({
    weightageName: initial?.weightageName ?? '',
    productCode: initial?.productCode ?? '',
    createdBy: initial?.createdBy ?? '',
    isActive: initial?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const validate = () => {
    const errs: Partial<typeof form> = {}
    if (!form.weightageName.trim()) errs.weightageName = 'Weightage Name is required'
    if (!form.productCode.trim()) errs.productCode = 'Product Code is required'
    if (!form.createdBy.trim()) errs.createdBy = 'Created By is required'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? 'Edit Weightage' : 'Add New Weightage'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Weightage Name <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              placeholder="e.g., Term Life Standard"
              value={form.weightageName}
              onChange={(e) => {
                setForm((f) => ({ ...f, weightageName: e.target.value }))
                setErrors((err) => ({ ...err, weightageName: undefined }))
              }}
            />
            {errors.weightageName && (
              <p className="mt-1 text-xs text-red-500">{errors.weightageName}</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Product Code <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              placeholder="e.g., TL-001"
              value={form.productCode}
              onChange={(e) => {
                setForm((f) => ({ ...f, productCode: e.target.value }))
                setErrors((err) => ({ ...err, productCode: undefined }))
              }}
            />
            {errors.productCode && (
              <p className="mt-1 text-xs text-red-500">{errors.productCode}</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Created By <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              placeholder="e.g., John Smith"
              value={form.createdBy}
              onChange={(e) => {
                setForm((f) => ({ ...f, createdBy: e.target.value }))
                setErrors((err) => ({ ...err, createdBy: undefined }))
              }}
            />
            {errors.createdBy && (
              <p className="mt-1 text-xs text-red-500">{errors.createdBy}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold text-neutral-600">Status</Label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                form.isActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {form.isActive ? (
                <FiToggleRight className="h-3.5 w-3.5" />
              ) : (
                <FiToggleLeft className="h-3.5 w-3.5" />
              )}
              {form.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        <Separator />
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="green" size="sm" onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Add'} Weightage
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteConfirmProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirm = ({ name, onConfirm, onCancel }: DeleteConfirmProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
      <div className="px-5 py-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <FiTrash2 className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-neutral-900">Delete Weightage</h2>
        <p className="mt-1.5 text-sm text-neutral-500">
          Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
        </p>
      </div>
      <Separator />
      <div className="flex justify-end gap-2 px-5 py-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductWeightage = () => {
  const [records, setRecords] = useState<WeightageRecord[]>(MOCK_WEIGHTAGES)
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<WeightageRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<WeightageRecord | null>(null)

  const handleAdd = (data: Omit<WeightageRecord, 'id' | 'createdAt'>) => {
    const newRecord: WeightageRecord = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    }
    setRecords((prev) => [newRecord, ...prev])
    setShowForm(false)
  }

  const handleEdit = (data: Omit<WeightageRecord, 'id' | 'createdAt'>) => {
    if (!editRecord) return
    setRecords((prev) =>
      prev.map((r) => (r.id === editRecord.id ? { ...r, ...data } : r)),
    )
    setEditRecord(null)
  }

  const handleDelete = () => {
    if (!deleteRecord) return
    setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id))
    setDeleteRecord(null)
  }

  const toggleActive = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-5 p-2">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Product Weightage Management</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage product weightage configurations used in incentive calculations.
            </p>
          </div>
          <Button
            variant="green"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
          >
            Add Weightage
          </Button>
        </div>

        {/* Table */}
        <Card className="rounded-xl border border-neutral-200 shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base">Weightage Records</CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500">
              {records.length} record{records.length !== 1 ? 's' : ''} total &nbsp;·&nbsp;{' '}
              {records.filter((r) => r.isActive).length} active
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <FiPlus className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-500">No weightage records</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Click "Add Weightage" to create your first record.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Weightage Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Product Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Created By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Created On
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr
                        key={record.id}
                        className={`border-b border-neutral-100 transition hover:bg-neutral-50 ${
                          idx === records.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-neutral-800">
                          {record.weightageName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs">
                            {record.productCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{record.createdBy}</td>
                        <td className="px-4 py-3 text-neutral-500 text-xs">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-xs ${
                              record.isActive
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                            }`}
                          >
                            {record.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Activate / Deactivate */}
                            <button
                              type="button"
                              title={record.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => toggleActive(record.id)}
                              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                                record.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {record.isActive ? (
                                <FiToggleRight className="h-4 w-4" />
                              ) : (
                                <FiToggleLeft className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">
                                {record.isActive ? 'Deactivate' : 'Activate'}
                              </span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => setEditRecord(record)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 transition hover:bg-blue-50"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => setDeleteRecord(record)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <WeightageForm
          initial={null}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          isEdit={false}
        />
      )}

      {/* Edit Form Modal */}
      {editRecord && (
        <WeightageForm
          initial={{
            weightageName: editRecord.weightageName,
            productCode: editRecord.productCode,
            createdBy: editRecord.createdBy,
            isActive: editRecord.isActive,
          }}
          onSave={handleEdit}
          onCancel={() => setEditRecord(null)}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation */}
      {deleteRecord && (
        <DeleteConfirm
          name={deleteRecord.weightageName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </div>
  )
}

export default ProductWeightage
