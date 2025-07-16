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
        {/* Header Moderno con Gradiente */}
        <div className="print-header-a4 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white p-6 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="w-full h-full bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
          </div>
          
          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              {/* Logo y datos de empresa */}
              {company?.logoBase64 && (
                <img 
                  src={company.logoBase64} 
                  alt="Logo" 
                  className="h-16 mb-3 rounded-lg shadow-lg bg-white p-1"
                  style={{ maxWidth: '200px' }}
                />
              )}
              <h1 className="text-2xl font-bold mb-2">{company?.denomination || 'MI EMPRESA S.A.C.'}</h1>
              <div className="space-y-1 text-slate-200">
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  {company?.address || 'Dirección de la empresa'}
                </p>
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Teléfono: {company?.phone || '999999999'}
                </p>
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  {company?.email || 'empresa@email.com'}
                </p>
              </div>
            </div>
            
            {/* Cuadro de RUC y documento */}
            <div className="bg-white text-gray-900 rounded-xl p-6 shadow-xl border-l-4 border-blue-500" style={{ minWidth: '280px' }}>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">RUC:</p>
                <p className="text-lg font-bold text-gray-900 mb-3">{company?.ruc || '20123456789'}</p>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3"></div>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">{documentType}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                  {sale.serial}-{sale.number.toString().padStart(8, '0')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Datos del cliente con diseño moderno */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
              INFORMACIÓN DEL CLIENTE
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Razón Social / Nombre:</span>
                  <p className="text-base font-medium text-gray-900">{customerInfo.name}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">{customerInfo.type}:</span>
                  <p className="text-base font-medium text-gray-900 font-mono">{customerInfo.document}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Dirección:</span>
                  <p className="text-sm text-gray-700">{customerInfo.address}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-semibold text-gray-600">Fecha de Emisión:</span>
                  <p className="text-base font-medium text-gray-900">{new Date(sale.emitDate).toLocaleDateString('es-PE')}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Hora:</span>
                  <p className="text-base font-medium text-gray-900 font-mono">{formatTime(sale.emitTime)}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Moneda:</span>
                  <p className="text-base font-medium text-gray-900">{sale.currency === 'PEN' ? 'Soles' : 'Dólares'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de detalles moderna */}
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="print-table-header bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="text-left py-4 px-4 font-semibold text-sm w-16">CANT.</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">DESCRIPCIÓN</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm w-28">P. UNITARIO</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm w-28">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sale.details.map((detail: any, idx: number) => (
                  <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-3 px-4 text-center font-medium text-gray-900">{detail.quantity}</td>
                    <td className="py-3 px-4 text-gray-800">
                      <div className="font-medium">{detail.description}</div>
                      {detail.product?.code && (
                        <div className="text-xs text-gray-500 mt-1">Código: {detail.product.code}</div>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 font-mono text-gray-900">{formatCurrency(detail.unitPrice)}</td>
                    <td className="text-right py-3 px-4 font-mono font-semibold text-gray-900">{formatCurrency(detail.totalAmount)}</td>
                  </tr>
                ))}
                {/* Filas de relleno para mantener altura mínima */}
                {Array.from({ length: Math.max(0, 8 - sale.details.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-gray-100">
                    <td className="py-3 px-4">&nbsp;</td>
                    <td className="py-3 px-4">&nbsp;</td>
                    <td className="py-3 px-4">&nbsp;</td>
                    <td className="py-3 px-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales y QR en layout moderno */}
          <div className="flex justify-between items-start gap-8">
            {/* Sección QR Code */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
                <div className="w-36 h-36 bg-white rounded-lg shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600 mb-1">QR</div>
                    <div className="text-xs text-gray-500">
                      {sale.serial}-{sale.number}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-tight max-w-36">
                  <span className="font-semibold">Representación impresa</span><br/>
                  del comprobante electrónico<br/>
                                     <span className="font-mono text-gray-500">#{sale?.id ? String(sale.id).substring(0, 8) : 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Sección de Totales */}
            <div className="flex-1 max-w-md">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-1 h-5 bg-green-500 rounded-full mr-2"></span>
                  RESUMEN DE IMPORTES
                </h4>
                <table className="w-full text-sm">
                  <tbody className="space-y-2">
                    {totals.gravada > 0 && (
                      <tr>
                        <td className="text-gray-600 py-2">Op. Gravada:</td>
                        <td className="text-right py-2 font-mono font-semibold text-gray-900">{formatCurrency(totals.gravada)}</td>
                      </tr>
                    )}
                    {totals.exonerada > 0 && (
                      <tr>
                        <td className="text-gray-600 py-2">Op. Exonerada:</td>
                        <td className="text-right py-2 font-mono font-semibold text-gray-900">{formatCurrency(totals.exonerada)}</td>
                      </tr>
                    )}
                    {totals.inafecta > 0 && (
                      <tr>
                        <td className="text-gray-600 py-2">Op. Inafecta:</td>
                        <td className="text-right py-2 font-mono font-semibold text-gray-900">{formatCurrency(totals.inafecta)}</td>
                      </tr>
                    )}
                    {totals.gratuita > 0 && (
                      <tr>
                        <td className="text-gray-600 py-2">Op. Gratuita:</td>
                        <td className="text-right py-2 font-mono font-semibold text-gray-900">{formatCurrency(totals.gratuita)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-gray-600 py-2">IGV ({sale.igvPercent || company?.igvPercentage || 18}%):</td>
                      <td className="text-right py-2 font-mono font-semibold text-gray-900">{formatCurrency(totals.igv)}</td>
                    </tr>
                    {totals.descuento > 0 && (
                      <tr>
                        <td className="text-red-600 py-2">Descuento:</td>
                        <td className="text-right py-2 font-mono font-semibold text-red-600">- {formatCurrency(totals.descuento)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300">
                      <td className="text-gray-800 py-3 font-bold text-lg">TOTAL A PAGAR:</td>
                      <td className="text-right py-3 font-bold text-xl text-blue-600 font-mono">{formatCurrency(totals.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Importe en letras */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-orange-200">
            <p className="text-sm">
              <span className="font-bold text-gray-800">SON:</span> 
              <span className="ml-2 text-gray-700 font-medium uppercase">{numeroALetras(totals.total)}</span>
            </p>
          </div>

          {/* Información adicional en grid */}
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 text-sm mb-1">Condición de pago:</p>
              <p className="text-gray-900 font-medium">{sale.paymentCondition || 'CONTADO'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 text-sm mb-1">Vendedor:</p>
              <p className="text-gray-900 font-medium">{sale.user?.firstName} {sale.user?.lastName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 text-sm mb-1">Estado:</p>
              <p className="text-gray-900 font-medium">{sale.operationStatus === '2' ? 'EMITIDO' : 'REGISTRADO'}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div className="text-center space-y-2">
              <p className="font-semibold text-gray-700 text-sm">Autorizado mediante Resolución N° 155-2017/SUNAT</p>
              <p className="text-gray-600 text-sm">Consulte su comprobante en: www.sunat.gob.pe</p>
              <p className="text-xs text-gray-500 mt-3 font-mono">
                Hash: {sale?.id ? String(sale.id).substring(0, 16) : 'N/A'}... | Página 1 de 1
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
            padding: 3mm !important;
          }

          .ticket-separator {
            border-top: 1px dashed #000 !important;
            margin: 3mm 0 !important;
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
        <div className="ticket-content p-3">
          {/* Header con logo */}
                     {company?.logoBase64 && (
             <div className="ticket-center mb-3">
               <img 
                 src={company.logoBase64} 
                 alt="Logo" 
                 className="h-12 mx-auto"
                 style={{ maxWidth: '60mm' }}
               />
             </div>
           )}

          {/* Datos de la empresa */}
          <div className="ticket-center mb-3">
            <div className="ticket-bold text-sm">{company?.denomination || 'MI EMPRESA S.A.C.'}</div>
            <div className="text-xs mt-1">RUC: {company?.ruc || '20123456789'}</div>
            <div className="text-xs">{company?.address || 'Dirección de la empresa'}</div>
            <div className="text-xs">Tel: {company?.phone || '999999999'}</div>
            <div className="text-xs">{company?.email || 'empresa@email.com'}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Tipo de documento */}
          <div className="ticket-center mb-3">
            <div className="ticket-bold text-sm">{documentType}</div>
            <div className="ticket-bold text-lg">{sale.serial}-{sale.number.toString().padStart(8, '0')}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Datos del cliente */}
          <div className="mb-3 text-xs">
            <div><span className="ticket-bold">CLIENTE:</span> {customerInfo.name}</div>
            <div><span className="ticket-bold">{customerInfo.type}:</span> {customerInfo.document}</div>
            <div><span className="ticket-bold">FECHA:</span> {new Date(sale.emitDate).toLocaleDateString('es-PE')} {formatTime(sale.emitTime)}</div>
            <div><span className="ticket-bold">MONEDA:</span> {sale.currency === 'PEN' ? 'SOLES' : 'DÓLARES'}</div>
          </div>

          <div className="ticket-separator"></div>

          {/* Tabla de productos */}
          <div className="mb-3">
            <table className="ticket-table w-full text-xs">
              <thead>
                <tr>
                  <td className="ticket-bold">CANT</td>
                  <td className="ticket-bold">DESCRIPCIÓN</td>
                  <td className="ticket-bold ticket-right">IMPORTE</td>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>

          <div className="ticket-separator"></div>

          {/* Totales */}
          <div className="text-xs">
            {totals.gravada > 0 && (
              <div className="flex justify-between">
                <span>OP. GRAVADA:</span>
                <span>{formatCurrency(totals.gravada)}</span>
              </div>
            )}
            {totals.exonerada > 0 && (
              <div className="flex justify-between">
                <span>OP. EXONERADA:</span>
                <span>{formatCurrency(totals.exonerada)}</span>
              </div>
            )}
            {totals.inafecta > 0 && (
              <div className="flex justify-between">
                <span>OP. INAFECTA:</span>
                <span>{formatCurrency(totals.inafecta)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IGV ({sale.igvPercent || company?.igvPercentage || 18}%):</span>
              <span>{formatCurrency(totals.igv)}</span>
            </div>
            {totals.descuento > 0 && (
              <div className="flex justify-between text-red-600">
                <span>DESCUENTO:</span>
                <span>- {formatCurrency(totals.descuento)}</span>
              </div>
            )}
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