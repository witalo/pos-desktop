// src/pages/products/ProductPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Package,
  Save,
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Hash,
  DollarSign,
  Box,
  FileText,
  Calculator,
  AlertCircle,
  Tag,
  Archive,
  Barcode,
  Shield,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'
import SuccessDialog from '../components/SuccessDialog'

// =============================================
// INTERFACES
// =============================================
interface TypeAffectation {
  code: number
  name: string
}

interface Unit {
  id: string
  description: string
}

interface ProductFormData {
  id?: string
  code: string
  codeSnt?: string
  description: string
  unitValue: number
  unitPrice: number
  purchasePrice: number
  stock: number
  typeAffectationId: number
  unitId: string
  photoBase64?: string
  removePhoto?: boolean
  isActive: boolean
}

// =============================================
// QUERIES Y MUTATIONS GRAPHQL
// =============================================
const GET_PRODUCT_QUERY = `
  query GetProductById($id: ID!, $companyId: ID!) {
    productById(id: $id, companyId: $companyId) {
      id
      code
      codeSnt
      description
      unitValue
      unitPrice
      purchasePrice
      stock
      typeAffectation {
        code
        name
      }
      unit {
        id
        description
      }
      photoBase64
      isActive
    }
  }
`

const GET_FORM_DATA_QUERY = `
  query GetFormData {
    typeAffectations {
      code
      name
    }
    units {
      id
      description
    }
  }
`

const SAVE_PRODUCT_MUTATION = `
  mutation SaveProduct($input: ProductInput!) {
    saveProduct(input: $input) {
      success
      message
      product {
        id
        code
        description
      }
      errors
    }
  }
`

export default function ProductPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { company } = useAuthStore()
  const igvPercentage = company?.igvPercentage || 18
  const isEditMode = !!id
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [typeAffectations, setTypeAffectations] = useState<TypeAffectation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [savedProduct, setSavedProduct] = useState<{ code: string; description: string } | null>(null)
  
  // Estado del formulario
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    codeSnt: '',
    description: '',
    unitValue: 0,
    unitPrice: 0,
    purchasePrice: 0,
    stock: 0,
    typeAffectationId: 10,
    unitId: '1',
    isActive: true
  })
  
  // Referencias
  const codeRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // =============================================
  // EFECTOS
  // =============================================
  useEffect(() => {
    loadFormData()
    if (isEditMode) {
      loadProduct()
    } else {
      setTimeout(() => codeRef.current?.focus(), 100)
    }
  }, [id])
  
  // =============================================
  // FUNCIONES DE CARGA
  // =============================================
  const loadFormData = async () => {
    try {
      const { typeAffectations, units } = await graphqlRequest(GET_FORM_DATA_QUERY)
      setTypeAffectations(typeAffectations || [])
      setUnits(units || [])
    } catch (error) {
      console.error('Error cargando datos del formulario:', error)
    }
  }
  
  const loadProduct = async () => {
    if (!id || !company?.id) return
    
    setLoading(true)
    try {
      const { productById } = await graphqlRequest(GET_PRODUCT_QUERY, {
        id,
        companyId: company.id
      })
      
      if (productById) {
        setFormData({
          id: productById.id,
          code: productById.code,
          codeSnt: productById.codeSnt || '',
          description: productById.description,
          unitValue: productById.unitValue,
          unitPrice: productById.unitPrice,
          purchasePrice: productById.purchasePrice,
          stock: productById.stock,
          typeAffectationId: productById.typeAffectation.code,
          unitId: productById.unit.id,
          isActive: productById.isActive
        })
        
        if (productById.photoBase64) {
          setImagePreview(productById.photoBase64)
        }
      }
    } catch (error) {
      console.error('Error cargando producto:', error)
      alert('Error al cargar el producto')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }
  
  // =============================================
  // MANEJO DE FORMULARIO
  // =============================================
  const handleUnitPriceChange = (value: number) => {
    // Calcular valor unitario sin IGV
    const unitValue = value / (1 + igvPercentage / 100)
    
    setFormData(prev => ({
      ...prev,
      unitPrice: value,
      unitValue: Number(unitValue.toFixed(2))
    }))
    
    // Limpiar error si existe
    if (errors.unitPrice) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.unitPrice
        return newErrors
      })
    }
  }
  
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen')
      return
    }
    
    // Validar tamaño (máx. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB')
      return
    }
    
    // Convertir a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData(prev => ({ 
        ...prev, 
        photoBase64: base64String,
        removePhoto: false 
      }))
    }
    reader.readAsDataURL(file)
  }
  
  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ 
      ...prev, 
      photoBase64: undefined,
      removePhoto: true 
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // =============================================
  // VALIDACIÓN Y GUARDADO
  // =============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria'
    }
    
    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = 'El precio de venta debe ser mayor a 0'
    }
    
    if (formData.unitPrice <= formData.unitValue) {
      newErrors.unitPrice = 'El precio de venta debe ser mayor al valor unitario'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const input = {
        ...formData,
        companyId: company?.id,
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim().toUpperCase(),
        codeSnt: formData.codeSnt?.trim().toUpperCase() || undefined
      }
      
      const { saveProduct } = await graphqlRequest(SAVE_PRODUCT_MUTATION, { input })
      
      if (saveProduct.success) {
        setSavedProduct({
          code: saveProduct.product.code,
          description: saveProduct.product.description
        })
        setShowSuccessDialog(true)
        
        // Navegar después de un breve delay
        setTimeout(() => {
          navigate('/products')
        }, 2000)
      } else {
        if (saveProduct.errors) {
          setErrors(saveProduct.errors)
        } else {
          alert(`Error: ${saveProduct.message}`)
        }
      }
    } catch (error) {
      console.error('Error guardando producto:', error)
      alert('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }
  
  // Navegación con Enter
  const handleKeyPress = (e: React.KeyboardEvent, nextField?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (nextField) {
        const element = document.getElementById(nextField)
        if (element) {
          element.focus()
          // Seleccionar contenido si es un input
          if (element instanceof HTMLInputElement && element.type !== 'checkbox') {
            element.select()
          }
        }
      } else {
        handleSubmit()
      }
    }
  }
  
  // =============================================
  // RENDERIZADO
  // =============================================
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando producto...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-3 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/products')}
              className="bg-white/10 p-1.5 rounded-md backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="bg-white/10 p-1.5 rounded-md backdrop-blur-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              <p className="text-xs text-slate-300 leading-none">
                {isEditMode ? 'Actualiza la información' : 'Registra un nuevo producto'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulario Compacto */}
      <div className="flex-1 overflow-auto p-3">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Panel Izquierdo - Información Principal */}
            <div className="lg:col-span-2 space-y-3">
              {/* Datos Básicos */}
              <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
                  <FileText className="w-3 h-3 mr-1.5" />
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Código */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={codeRef}
                        id="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                        onKeyPress={(e) => handleKeyPress(e, 'codeSnt')}
                        onFocus={(e) => e.target.select()}
                        className={`w-full pl-7 pr-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono ${
                          errors.code ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="PROD001"
                      />
                      <Hash className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                    </div>
                    {errors.code && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.code}</p>
                    )}
                  </div>
                  
                  {/* Código SUNAT */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Código SUNAT
                    </label>
                    <div className="relative">
                      <input
                        id="codeSnt"
                        type="text"
                        value={formData.codeSnt}
                        onChange={(e) => handleInputChange('codeSnt', e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'description')}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="Opcional"
                      />
                      <Barcode className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
                
                {/* Descripción */}
                <div className="mt-2">
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="description"
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value.toUpperCase())}
                      onKeyPress={(e) => handleKeyPress(e, 'unitId')}
                      onFocus={(e) => e.target.select()}
                      className={`w-full pl-7 pr-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Nombre del producto"
                    />
                    <Tag className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                  </div>
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>
                  )}
                </div>
                
                {/* Unidad y Tipo de Afectación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="unitId"
                        value={formData.unitId}
                        onChange={(e) => handleInputChange('unitId', e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'typeAffectationId')}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.description}</option>
                        ))}
                      </select>
                      <Box className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Tipo de Afectación <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="typeAffectationId"
                        value={formData.typeAffectationId}
                        onChange={(e) => handleInputChange('typeAffectationId', Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e, 'stock')}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        {typeAffectations.map(type => (
                          <option key={type.code} value={type.code}>{type.name}</option>
                        ))}
                      </select>
                      <Shield className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Precios y Stock */}
              <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
                  <Calculator className="w-3 h-3 mr-1.5" />
                  Precios y Stock
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Stock Inicial
                    </label>
                    <div className="relative">
                      <input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e, 'purchasePrice')}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-7 pr-1 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        step="0.01"
                        min="0"
                      />
                      <Archive className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                  
                  {/* Precio de Compra */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      P. Compra
                    </label>
                    <div className="relative">
                      <input
                        id="purchasePrice"
                        type="number"
                        value={formData.purchasePrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(',', '.')
                          handleInputChange('purchasePrice', Number(value))
                        }}
                        onKeyPress={(e) => handleKeyPress(e, 'unitPrice')}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-7 pr-1 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2 text-xs font-medium text-slate-400">S/</span>
                    </div>
                  </div>
                  
                  {/* Valor Unitario (bloqueado) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      Valor sin IGV
                    </label>
                    <div className="relative">
                      <input
                        id="unitValue"
                        type="number"
                        value={formData.unitValue}
                        readOnly
                        tabIndex={-1}
                        className="w-full pl-7 pr-1 py-1.5 text-xs border border-slate-200 bg-slate-50 rounded-md font-mono cursor-not-allowed"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2 text-xs font-medium text-slate-400">S/</span>
                    </div>
                  </div>
                  
                  {/* Precio de Venta */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-0.5">
                      P. Venta c/IGV <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(',', '.')
                          handleUnitPriceChange(Number(value))
                        }}
                        onKeyPress={(e) => handleKeyPress(e, 'isActive')}
                        onFocus={(e) => e.target.select()}
                        className={`w-full pl-7 pr-1 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                          errors.unitPrice ? 'border-red-500' : 'border-slate-300'
                        }`}
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2 text-xs font-medium text-slate-400">S/</span>
                    </div>
                    {errors.unitPrice && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.unitPrice}</p>
                    )}
                  </div>
                </div>
                
                {/* Información de margen */}
                {formData.unitValue > 0 && formData.unitPrice > 0 && (
                  <div className="mt-2 p-1.5 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Margen:</strong>{' '}
                      {((formData.unitPrice - formData.unitValue) / formData.unitValue * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Panel Derecho - Imagen y Estado */}
            <div className="space-y-3">
              {/* Imagen del Producto */}
              <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
                  <ImageIcon className="w-3 h-3 mr-1.5" />
                  Imagen del Producto
                </h3>
                
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-32 object-cover rounded-md border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-50"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-600">Click para subir</p>
                      <p className="text-xs text-slate-400 mt-0.5">Máx. 5MB</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Estado */}
              <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 mb-2">Estado</h3>
                
                <label 
                  htmlFor="isActive"
                  className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-md"
                >
                  <span className="text-xs text-slate-700 font-medium">Producto activo</span>
                  <div className="relative">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${
                      formData.isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.isActive ? 'translate-x-5' : ''
                      }`} />
                    </div>
                    {formData.isActive ? (
                      <ToggleRight className="absolute right-0 top-0 w-5 h-5 text-blue-600 pointer-events-none" />
                    ) : (
                      <ToggleLeft className="absolute right-0 top-0 w-5 h-5 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </label>
              </div>
              
              {/* Botones de acción */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-2 font-bold rounded-md transition-all flex items-center justify-center text-xs ${
                    saving
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1.5" />
                      {isEditMode ? 'Actualizar' : 'Guardar'} Producto
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors font-semibold text-xs"
                >
                  Cancelar
                </button>
              </div>
              
              {/* Información adicional */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                <div className="flex items-start space-x-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold mb-0.5">Tips:</p>
                    <ul className="space-y-0.5 list-disc list-inside text-xs">
                      <li>Usa códigos únicos</li>
                      <li>Precio incluye IGV</li>
                      <li>Navega con Enter</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Diálogo de éxito */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="¡Producto guardado!"
        message={`${savedProduct?.code} - ${savedProduct?.description}`}
        subMessage={isEditMode ? "El producto se actualizó correctamente" : "El producto se creó exitosamente"}
        autoCloseDelay={2000}
      />
    </div>
  )
}