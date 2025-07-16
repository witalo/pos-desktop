// src/components/InvoicePDF.tsx
import { numeroALetras, formatCurrency, formatTime } from '../utils/numberToWords'

interface InvoicePDFProps {
  sale: any // Deberías tipar esto con la interface correcta
  company: any
}

// Componente para formato A4 (Diseño moderno)
function A4Format({ sale, company }: InvoicePDFProps) {
  // Información del cliente
  const customerInfo = sale.person ? {
    name: sale.person.fullName,
    document: sale.person.document,
    type: sale.person.personType === '6' ? 'RUC' : 'DNI',
    address: sale.person.address || 'No especificada',
    email: sale.person.email || 'No especificado',
    phone: sale.person.phone || 'No especificado'
  } : {
    name: 'CLIENTE GENERAL',
    document: '00000000',
    type: 'DNI',
    address: 'No especificada',
    email: 'No especificado',
    phone: 'No especificado'
  }

  // Tipo de documento
  const documentType = sale.serial.startsWith('F') ? 'FACTURA ELECTRÓNICA' : 
                      sale.serial.startsWith('B') ? 'BOLETA DE VENTA ELECTRÓNICA' : 
                      'NOTA DE VENTA';

  // Calcular totales por tipo de operación
  const totals = {
    gravada: sale.totalTaxable || 0,
    exonerada: sale.totalExempt || 0,
    inafecta: sale.totalUnaffected || 0,
    gratuita: sale.totalFree || 0,
    descuento: sale.totalDiscount || 0,
    subtotal: sale.totalTaxable || 0,
    igv: sale.igvAmount || 0,
    total: sale.totalAmount || 0
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container-a4 {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 12px !important;
          }

          .print-header-a4 {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-table-header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: white !important;
          }
        }

        .a4-container {
          font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
          line-height: 1.4;
          color: #1f2937;
        }
      `}} />

      <div className="print-container-a4 a4-container bg-white mx-auto shadow-2xl border border-gray-100" style={{ width: '21cm', minHeight: '29.7cm' }}>
        {/* Header Compacto */}
        <div className="print-header-a4 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white p-3 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <div className="w-full h-full bg-white rounded-full transform translate-x-12 -translate-y-12"></div>
          </div>
          
          <div className="relative grid grid-cols-3 gap-4 items-center">
            {/* IZQUIERDA: Solo Logo */}
            <div className="flex justify-start items-center">
              {company?.logoBase64 && (
                <img 
                  src={company.logoBase64} 
                  alt="Logo" 
                  className="h-20 w-20 rounded-full shadow-lg bg-white p-1 object-cover"
                  style={{ minWidth: '80px' }}
                />
              )}
            </div>
            
            {/* CENTRO: Información de empresa centrada */}
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-xl font-bold mb-1">{company?.denomination || 'MI EMPRESA S.A.C.'}</h1>
              <div className="space-y-0.5 text-slate-200 text-sm">
                <p className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                  {company?.address || 'Dirección de la empresa'}
                </p>
                <p className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                  Teléfono: {company?.phone || '999999999'}
                </p>
                <p className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                  {company?.email || 'empresa@email.com'}
                </p>
              </div>
            </div>
            
            {/* DERECHA: Cuadro de RUC y documento */}
            <div className="flex justify-end items-center">
              <div className="bg-white text-gray-900 rounded-lg p-3 shadow-lg border-l-4 border-blue-500" style={{ minWidth: '220px' }}>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-600 mb-1">RUC:</p>
                  <p className="text-sm font-bold text-gray-900 mb-2">{company?.ruc || '20123456789'}</p>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{documentType}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
                    {sale.serial}-{sale.number.toString().padStart(8, '0')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3">
          {/* Datos del cliente compacto */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-800 mb-2 text-left">
              INFORMACIÓN DEL CLIENTE
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-left">
                <div className="mb-1.5">
                  <span className="text-xs text-gray-600">Razón Social / Nombre:</span>
                  <div className="font-medium text-gray-900">{customerInfo.name}</div>
                </div>
                <div className="mb-1.5">
                  <span className="text-xs text-gray-600">{customerInfo.type}:</span>
                  <div className="font-medium text-gray-900 font-mono">{customerInfo.document}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Dirección:</span>
                  <div className="text-xs text-gray-700">{customerInfo.address}</div>
                </div>
              </div>
              <div className="text-left">
                <div className="mb-1.5">
                  <span className="text-xs text-gray-600">Fecha de Emisión:</span>
                  <div className="font-medium text-gray-900">{new Date(sale.emitDate).toLocaleDateString('es-PE')}</div>
                </div>
                <div className="mb-1.5">
                  <span className="text-xs text-gray-600">Hora:</span>
                  <div className="font-medium text-gray-900 font-mono">{formatTime(sale.emitTime)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Moneda:</span>
                  <div className="font-medium text-gray-900">{sale.currency === 'PEN' ? 'Soles' : 'Dólares'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de detalles compacta */}
          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="print-table-header bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="text-left py-1.5 px-2 font-semibold text-xs w-12">CANT.</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-xs">DESCRIPCIÓN</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-xs w-20">P. UNIT</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-xs w-20">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* Mostrar detalles reales */}
                {sale.details.map((detail: any, idx: number) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-1.5 px-2 text-center font-medium text-gray-900 text-xs">{detail.quantity}</td>
                    <td className="py-1.5 px-2 text-gray-800">
                      <div className="font-medium text-xs">{detail.description}</div>
                      {detail.product?.code && (
                        <div className="text-xs text-gray-500">Cód: {detail.product.code}</div>
                      )}
                    </td>
                    <td className="text-right py-1.5 px-2 font-mono text-gray-900 text-xs">{formatCurrency(detail.unitPrice)}</td>
                    <td className="text-right py-1.5 px-2 font-mono font-semibold text-gray-900 text-xs">{formatCurrency(detail.totalAmount)}</td>
                  </tr>
                ))}
                
                {/* Agregar líneas vacías para completar 5 líneas mínimo */}
                {Array.from({ length: Math.max(0, 5 - sale.details.length) }, (_, idx) => (
                  <tr key={`empty-${idx}`} className={`border-b border-gray-100 ${(sale.details.length + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-1.5 px-2 text-center text-xs">&nbsp;</td>
                    <td className="py-1.5 px-2 text-xs">&nbsp;</td>
                    <td className="text-right py-1.5 px-2 text-xs">&nbsp;</td>
                    <td className="text-right py-1.5 px-2 text-xs">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

                    {/* Totales y QR compacto */}
          <div className="flex justify-between items-start gap-3">
            {/* Sección QR Code */}
            <div className="flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                <div className="w-20 h-20 bg-white rounded border border-dashed border-gray-300 flex items-center justify-center mb-1.5">
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-600">QR</div>
                    <div className="text-xs text-gray-500">{sale.serial}-{sale.number}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  Representación impresa<br/>del comprobante electrónico
                </p>
              </div>
            </div>

            {/* Sección de Totales */}
            <div className="flex-1 max-w-xs">
              <div className="bg-white rounded-lg p-2.5 border border-gray-300">
                <h4 className="text-xs font-bold text-gray-800 mb-1.5 text-center border-b border-blue-500 pb-1">
                  RESUMEN DE IMPORTES
                </h4>
                <div className="space-y-0.5 text-xs">
                  {/* Subtotal */}
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Sub Total:</span>
                    <span className="font-mono font-bold">{formatCurrency(totals.gravada + totals.exonerada + totals.inafecta)}</span>
                  </div>
                  
                  {/* Descuento Global */}
                  {totals.descuento > 0 && (
                    <div className="flex justify-between py-1 text-red-600">
                      <span>Descuento:</span>
                      <span className="font-mono font-bold">- {formatCurrency(totals.descuento)}</span>
                    </div>
                  )}
                  
                  {/* Operaciones según SUNAT */}
                  <div className="flex justify-between py-1 bg-blue-50 px-2 rounded">
                    <span className="text-blue-700 font-medium">Op. Gravada:</span>
                    <span className="font-mono font-bold text-blue-700">{formatCurrency(totals.gravada)}</span>
                  </div>
                  
                  {totals.exonerada > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Op. Exonerada:</span>
                      <span className="font-mono">{formatCurrency(totals.exonerada)}</span>
                    </div>
                  )}
                  
                  {totals.inafecta > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Op. Inafecta:</span>
                      <span className="font-mono">{formatCurrency(totals.inafecta)}</span>
                    </div>
                  )}
                  
                  {totals.gratuita > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Op. Gratuita:</span>
                      <span className="font-mono">{formatCurrency(totals.gratuita)}</span>
                    </div>
                  )}
                  
                  {/* IGV */}
                  <div className="flex justify-between py-1 bg-orange-50 px-2 rounded">
                    <span className="text-orange-700 font-medium">IGV ({sale.igvPercent || company?.igvPercentage || 18}%):</span>
                    <span className="font-mono font-bold text-orange-700">{formatCurrency(totals.igv)}</span>
                  </div>
                  
                  {/* Total Final */}
                  <div className="flex justify-between py-2 px-2 bg-blue-600 text-white rounded mt-2">
                    <span className="font-bold">TOTAL:</span>
                    <span className="font-mono font-bold">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Importe en letras compacto */}
          <div className="mt-3 p-2 bg-yellow-50 rounded border border-orange-200">
            <p className="text-xs">
              <span className="font-bold text-gray-800">SON:</span> 
              <span className="ml-1 text-gray-700 font-medium uppercase">{numeroALetras(totals.total)}</span>
            </p>
          </div>

          {/* Información adicional compacta */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">Condición:</p>
              <p className="text-xs font-medium">{sale.paymentCondition || 'CONTADO'}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">Vendedor:</p>
              <p className="text-xs font-medium">{sale.user?.firstName} {sale.user?.lastName}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">Estado:</p>
              <p className="text-xs font-medium">{sale.operationStatus === '2' ? 'EMITIDO' : 'REGISTRADO'}</p>
            </div>
          </div>

          {/* Footer compacto */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600">Autorizado mediante Resolución N° 155-2017/SUNAT</p>
              <p className="text-xs text-gray-600">www.sunat.gob.pe</p>
              <p className="text-xs text-gray-500 font-mono">
                ID: {sale?.id ? String(sale.id).substring(0, 8) : 'N/A'}... | Página 1 de 1
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Componente para formato Ticket 80mm (Diseño térmico)
function TicketFormat({ sale, company }: InvoicePDFProps) {
  // Información del cliente
  const customerInfo = sale.person ? {
    name: sale.person.fullName,
    document: sale.person.document,
    type: sale.person.personType === '6' ? 'RUC' : 'DNI'
  } : {
    name: 'CLIENTE GENERAL',
    document: '00000000',
    type: 'DNI'
  }

  // Tipo de documento
  const documentType = sale.serial.startsWith('F') ? 'FACTURA ELECTRÓNICA' : 
                      sale.serial.startsWith('B') ? 'BOLETA DE VENTA ELECTRÓNICA' : 
                      'NOTA DE VENTA';

  // Calcular totales
  const totals = {
    gravada: sale.totalTaxable || 0,
    exonerada: sale.totalExempt || 0,
    inafecta: sale.totalUnaffected || 0,
    gratuita: sale.totalFree || 0,
    descuento: sale.totalDiscount || 0,
    subtotal: sale.totalTaxable || 0,
    igv: sale.igvAmount || 0,
    total: sale.totalAmount || 0
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: 'Courier New', monospace;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container-ticket {
            width: 76mm !important;
            max-width: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
          }

          .ticket-content {
            padding: 2mm !important;
          }

          .ticket-separator {
            border-top: 1px dashed #000 !important;
            margin: 2mm 0 !important;
          }

          .ticket-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .ticket-table td {
            padding: 1mm 0 !important;
            font-size: 10px !important;
          }
        }

        .ticket-container {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.3;
          color: #000;
          width: 80mm;
        }

        .ticket-bold {
          font-weight: bold;
        }

        .ticket-center {
          text-align: center;
        }

        .ticket-right {
          text-align: right;
        }

        .ticket-separator {
          border-top: 1px dashed #333;
          margin: 8px 0;
        }

        .ticket-double-line {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
      `}} />

      <div className="print-container-ticket ticket-container bg-white mx-auto border border-gray-300" style={{ width: '80mm', minHeight: 'auto' }}>
        <div className="ticket-content p-2">
          {/* Header con logo */}
                     {company?.logoBase64 && (
             <div className="ticket-center mb-2">
               <img 
                 src={company.logoBase64} 
                 alt="Logo" 
                 className="h-8 mx-auto"
                 style={{ maxWidth: '50mm' }}
               />
             </div>
           )}

          {/* Datos de la empresa */}
          <div className="ticket-center mb-2">
            <div className="ticket-bold text-sm">{company?.denomination || 'MI EMPRESA S.A.C.'}</div>
            <div className="text-xs mt-0.5">RUC: {company?.ruc || '20123456789'}</div>
            <div className="text-xs">{company?.address || 'Dirección de la empresa'}</div>
            <div className="text-xs">Tel: {company?.phone || '999999999'}</div>
            <div className="text-xs">{company?.email || 'empresa@email.com'}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Tipo de documento */}
          <div className="ticket-center mb-2">
            <div className="ticket-bold text-sm">{documentType}</div>
            <div className="ticket-bold text-base">{sale.serial}-{sale.number.toString().padStart(8, '0')}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Datos del cliente */}
          <div className="mb-2 text-xs">
            <div><span className="ticket-bold">CLIENTE:</span> {customerInfo.name}</div>
            <div><span className="ticket-bold">{customerInfo.type}:</span> {customerInfo.document}</div>
            <div><span className="ticket-bold">FECHA:</span> {new Date(sale.emitDate).toLocaleDateString('es-PE')} {formatTime(sale.emitTime)}</div>
            <div><span className="ticket-bold">MONEDA:</span> {sale.currency === 'PEN' ? 'SOLES' : 'DÓLARES'}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Tabla de productos */}
          <div className="mb-2">
            <table className="ticket-table w-full text-xs">
              <thead>
                <tr>
                  <td className="ticket-bold">CANT</td>
                  <td className="ticket-bold">DESCRIPCIÓN</td>
                  <td className="ticket-bold ticket-right">IMPORTE</td>
                </tr>
              </thead>
              <tbody>
                {/* Mostrar detalles reales */}
                {sale.details.map((detail: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ width: '10mm' }}>{detail.quantity}</td>
                    <td style={{ width: '45mm' }}>
                      <div>{detail.description}</div>
                      <div className="text-xs">@{formatCurrency(detail.unitPrice)}</div>
                    </td>
                    <td className="ticket-right" style={{ width: '20mm' }}>{formatCurrency(detail.totalAmount)}</td>
                  </tr>
                ))}
                
                {/* Agregar líneas vacías para completar 5 líneas mínimo */}
                {Array.from({ length: Math.max(0, 5 - sale.details.length) }, (_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td style={{ width: '10mm' }}>&nbsp;</td>
                    <td style={{ width: '45mm' }}>&nbsp;</td>
                    <td className="ticket-right" style={{ width: '20mm' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ticket-separator"></div>

          {/* Totales */}
          <div className="text-xs space-y-1">
            {/* Subtotal */}
            <div className="flex justify-between py-1 border-b border-dashed border-gray-400">
              <span className="ticket-bold">SUB TOTAL:</span>
              <span className="ticket-bold">{formatCurrency(totals.gravada + totals.exonerada + totals.inafecta)}</span>
            </div>
            
            {/* Descuento Global (si existe) */}
            {totals.descuento > 0 && (
              <div className="flex justify-between py-1">
                <span className="ticket-bold">DESCUENTO GLOBAL:</span>
                <span className="ticket-bold">- {formatCurrency(totals.descuento)}</span>
              </div>
            )}
            
            <div className="ticket-separator my-1"></div>
            
            {/* Operaciones según SUNAT - SIEMPRE mostrar Op. Gravada */}
            <div className="flex justify-between py-1">
              <span className="ticket-bold">OP. GRAVADA:</span>
              <span className="ticket-bold">{formatCurrency(totals.gravada)}</span>
            </div>
            
            {totals.exonerada > 0 && (
              <div className="flex justify-between py-1">
                <span>OP. EXONERADA:</span>
                <span>{formatCurrency(totals.exonerada)}</span>
              </div>
            )}
            
            {totals.inafecta > 0 && (
              <div className="flex justify-between py-1">
                <span>OP. INAFECTA:</span>
                <span>{formatCurrency(totals.inafecta)}</span>
              </div>
            )}
            
            {totals.gratuita > 0 && (
              <div className="flex justify-between py-1">
                <span>OP. GRATUITA:</span>
                <span>{formatCurrency(totals.gratuita)}</span>
              </div>
            )}
            
            {/* IGV - SIEMPRE mostrar */}
            <div className="flex justify-between py-1">
              <span className="ticket-bold">IGV ({sale.igvPercent || company?.igvPercentage || 18}%):</span>
              <span className="ticket-bold">{formatCurrency(totals.igv)}</span>
            </div>
          </div>

          <div className="ticket-double-line"></div>

          {/* Total final */}
          <div className="flex justify-between ticket-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>

          <div className="ticket-separator"></div>

          {/* Importe en letras */}
          <div className="text-xs mb-3">
            <div className="ticket-bold">SON:</div>
            <div className="text-xs leading-tight">{numeroALetras(totals.total)}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Información adicional */}
          <div className="text-xs mb-3">
            <div><span className="ticket-bold">CONDICIÓN:</span> {sale.paymentCondition || 'CONTADO'}</div>
            <div><span className="ticket-bold">VENDEDOR:</span> {sale.user?.firstName} {sale.user?.lastName}</div>
          </div>

          {/* QR Code placeholder */}
          <div className="ticket-center mb-3">
            <div className="w-16 h-16 bg-gray-200 mx-auto flex items-center justify-center text-xs border">
              QR<br/>{sale.serial}-{sale.number}
            </div>
          </div>

          {/* Footer */}
          <div className="ticket-center text-xs">
            <div>Autorizado mediante</div>
            <div>Resolución N° 155-2017/SUNAT</div>
            <div className="mt-2">www.sunat.gob.pe</div>
            <div className="mt-2">ID: {sale?.id ? String(sale.id).substring(0, 8) : 'N/A'}...</div>
          </div>

          <div className="ticket-separator"></div>

          <div className="ticket-center text-xs">
            <div>*** GRACIAS POR SU COMPRA ***</div>
          </div>

          <div className="ticket-separator"></div>
        </div>
      </div>
    </>
  );
}

// Componente principal que decide qué formato usar
export default function InvoicePDF({ sale, company }: InvoicePDFProps) {
  // Determinar el formato basado en la configuración de la empresa
  // Por defecto usar A4 si no está especificado
  const pdfFormat = company?.pdfSize || 'A';

  if (pdfFormat === 'T') {
    return <TicketFormat sale={sale} company={company} />;
  } else {
    return <A4Format sale={sale} company={company} />;
  }
}