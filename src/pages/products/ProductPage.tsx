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
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { graphqlRequest } from '../../services/graphql'

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
  const igvPercentage = company?.igvPercentage || 18; // Valor por defecto 18% si no existe
  const isEditMode = !!id
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [typeAffectations, setTypeAffectations] = useState<TypeAffectation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  
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
    const unitValue = value / (1 + igvPercentage / 100);
    
    setFormData(prev => ({
        ...prev,
        unitPrice: value,
        unitValue: Number(unitValue.toFixed(2)) // Redondear a 2 decimales
    }));
    
    // Limpiar error si existe
    if (errors.unitPrice) {
        setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.unitPrice;
        return newErrors;
        });
    }
    };
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
    
    // Auto-calcular precio de venta si cambia el valor unitario
    if (field === 'unitValue' && value > 0) {
      const margin = 1.3 // 30% de margen por defecto
      const suggestedPrice = value * margin
      setFormData(prev => ({ ...prev, unitPrice: Number(suggestedPrice.toFixed(2)) }))
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
        alert(`Producto ${isEditMode ? 'actualizado' : 'creado'} exitosamente`)
        navigate('/products')
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
        element?.focus()
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
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/products')}
              className="bg-white/10 p-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              <p className="text-xs text-slate-300 leading-tight">
                {isEditMode ? 'Actualiza la información del producto' : 'Registra un nuevo producto en tu inventario'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulario */}
      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Panel Izquierdo - Información Principal */}
            <div className="lg:col-span-2 space-y-4">
              {/* Datos Básicos */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Código */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
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
                        className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono ${
                          errors.code ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="EJ: PROD001"
                      />
                      <Hash className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                    {errors.code && (
                      <p className="text-xs text-red-500 mt-1">{errors.code}</p>
                    )}
                  </div>
                  
                  {/* Código SUNAT */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Código SUNAT
                    </label>
                    <input
                      id="codeSnt"
                      type="text"
                      value={formData.codeSnt}
                      onChange={(e) => handleInputChange('codeSnt', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'description')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                
                {/* Descripción */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value.toUpperCase())}
                    onKeyPress={(e) => handleKeyPress(e, 'unitId')}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Nombre del producto"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>
                
                {/* Unidad y Tipo de Afectación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unitId"
                      value={formData.unitId}
                      onChange={(e) => handleInputChange('unitId', e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'typeAffectationId')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.description}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tipo de Afectación <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="typeAffectationId"
                      value={formData.typeAffectationId}
                      onChange={(e) => handleInputChange('typeAffectationId', Number(e.target.value))}
                      onKeyPress={(e) => handleKeyPress(e, 'stock')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {typeAffectations.map(type => (
                        <option key={type.code} value={type.code}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Precios y Stock */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Precios y Stock
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Stock Inicial
                    </label>
                    <div className="relative">
                      <input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e, 'purchasePrice')}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        step="0.01"
                        min="0"
                      />
                      <Box className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  
                  {/* Precio de Compra */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      P. Compra
                    </label>
                    <div className="relative">
                      <input
                        id="purchasePrice"
                        type="number"
                        value={formData.purchasePrice}
                        onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e, 'unitValue')}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2.5 text-xs font-medium text-slate-400">S/</span>
                    </div>
                  </div>
                  
                  {/* Valor Unitario */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Valor Unit. (sin IGV)
                    </label>
                    <div className="relative">
                      <input
                        id="unitValue"
                        type="number"
                        value={formData.unitValue}
                        readOnly 
                        onChange={(e) => handleInputChange('unitValue', Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e, 'unitPrice')}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2.5 text-xs font-medium text-slate-400">S/</span>
                    </div>
                  </div>
                  
                  {/* Precio de Venta */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      P. Venta (con IGV) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        // onChange={(e) => handleInputChange('unitPrice', Number(e.target.value))}
                        onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                        onKeyPress={(e) => handleKeyPress(e)}
                        className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                          errors.unitPrice ? 'border-red-500' : 'border-slate-300'
                        }`}
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute left-2 top-2.5 text-xs font-medium text-slate-400">S/</span>
                    </div>
                    {errors.unitPrice && (
                      <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>
                    )}
                  </div>
                </div>
                
                {/* Información de margen */}
                {formData.unitValue > 0 && formData.unitPrice > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Margen de ganancia:</strong>{' '}
                      {((formData.unitPrice - formData.unitValue) / formData.unitValue * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Panel Derecho - Imagen y Estado */}
            <div className="space-y-4">
              {/* Imagen del Producto */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Imagen del Producto
                </h3>
                
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-50"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">Click para subir imagen</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP (máx. 5MB)</p>
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
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Estado</h3>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">Producto activo</span>
                </label>
              </div>
              
              {/* Botones de acción */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-2.5 font-bold rounded-lg transition-all flex items-center justify-center text-sm ${
                    saving
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Actualizar Producto' : 'Guardar Producto'}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="w-full py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-semibold text-sm"
                >
                  Cancelar
                </button>
              </div>
              
              {/* Información adicional */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold mb-1">Tips:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Usa códigos únicos para cada producto</li>
                      <li>El precio de venta incluye IGV</li>
                      <li>Puedes navegar con Enter entre campos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}