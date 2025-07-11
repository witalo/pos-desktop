// src/components/InvoicePDF.tsx
import { numeroALetras, formatCurrency, formatTime } from '../utils/numberToWords'

interface InvoicePDFProps {
  sale: any // Deberías tipar esto con la interface correcta
  company: any
}

export default function InvoicePDF({ sale, company }: InvoicePDFProps) {
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

  // Generar datos para el QR
  const qrData = `${company?.ruc}|${documentType}|${sale.serial}|${sale.number}|${totals.igv.toFixed(2)}|${totals.total.toFixed(2)}|${sale.emitDate}|${customerInfo.type}|${customerInfo.document}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .print-content {
            padding: 15mm !important;
          }
        }
      `}} />

      <div className="print-container bg-white mx-auto shadow-lg" style={{ width: '21cm', minHeight: '29.7cm', fontFamily: 'Arial, sans-serif' }}>
        <div className="print-content p-8">
          {/* Header con Logo y datos de empresa */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {/* Logo */}
              {company?.logoBase64 && (
                <img 
                  src={`data:image/png;base64,${company.logoBase64}`} 
                  alt="Logo" 
                  className="h-16 mb-2"
                  style={{ maxWidth: '200px' }}
                />
              )}
              <h2 className="text-xl font-bold text-gray-900">{company?.denomination || 'MI EMPRESA S.A.C.'}</h2>
              <p className="text-sm text-gray-600">{company?.address || 'Dirección de la empresa'}</p>
              <p className="text-sm text-gray-600">Teléfono: {company?.phone || '999999999'}</p>
              <p className="text-sm text-gray-600">Email: {company?.email || 'empresa@email.com'}</p>
            </div>
            
            {/* Cuadro de RUC y documento */}
            <div className="border-2 border-gray-800 rounded-lg p-4 text-center" style={{ minWidth: '250px' }}>
              <p className="text-sm font-bold text-gray-700">RUC: {company?.ruc || '20123456789'}</p>
              <div className="h-px bg-gray-800 my-2"></div>
              <p className="text-lg font-bold text-gray-900">{documentType}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{sale.serial}-{sale.number.toString().padStart(8, '0')}</p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4" style={{ backgroundColor: '#f9fafb' }}>
            <h3 className="text-sm font-bold text-gray-700 mb-2">DATOS DEL CLIENTE</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Razón Social:</span>
                <span className="ml-2 font-medium">{customerInfo.name}</span>
              </div>
              <div>
                <span className="text-gray-600">{customerInfo.type}:</span>
                <span className="ml-2 font-medium">{customerInfo.document}</span>
              </div>
              <div>
                <span className="text-gray-600">Fecha de Emisión:</span>
                <span className="ml-2 font-medium">{new Date(sale.emitDate).toLocaleDateString('es-PE')}</span>
              </div>
              <div>
                <span className="text-gray-600">Hora:</span>
                <span className="ml-2 font-medium">{formatTime(sale.emitTime)}</span>
              </div>
            </div>
          </div>

          {/* Tabla de detalles */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-2 px-1 w-16">CANT.</th>
                  <th className="text-left py-2 px-1">DESCRIPCIÓN</th>
                  <th className="text-right py-2 px-1 w-24">P. UNIT</th>
                  <th className="text-right py-2 px-1 w-24">IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                {sale.details.map((detail: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-1 text-center">{detail.quantity}</td>
                    <td className="py-2 px-1">{detail.description}</td>
                    <td className="text-right py-2 px-1 font-mono">{formatCurrency(detail.unitPrice)}</td>
                    <td className="text-right py-2 px-1 font-mono">{formatCurrency(detail.totalAmount)}</td>
                  </tr>
                ))}
                {/* Rellenar filas vacías para mantener formato */}
                {Array.from({ length: Math.max(0, 10 - sale.details.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-gray-200">
                    <td className="py-2 px-1">&nbsp;</td>
                    <td className="py-2 px-1">&nbsp;</td>
                    <td className="py-2 px-1">&nbsp;</td>
                    <td className="py-2 px-1">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales y QR */}
          <div className="flex justify-between items-end">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="border-2 border-gray-300 p-2 rounded">
                <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                  {/* En producción aquí iría el QR real generado con los datos */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500">QR Code</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {sale.serial}-{sale.number}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Representación impresa<br/>
                del comprobante electrónico
              </p>
            </div>

            {/* Totales */}
            <div className="w-80">
              <table className="w-full text-sm">
                <tbody>
                  {totals.gravada > 0 && (
                    <tr>
                      <td className="text-right py-1">Op. Gravada:</td>
                      <td className="text-right py-1 pl-4 font-mono">{formatCurrency(totals.gravada)}</td>
                    </tr>
                  )}
                  {totals.exonerada > 0 && (
                    <tr>
                      <td className="text-right py-1">Op. Exonerada:</td>
                      <td className="text-right py-1 pl-4 font-mono">{formatCurrency(totals.exonerada)}</td>
                    </tr>
                  )}
                  {totals.inafecta > 0 && (
                    <tr>
                      <td className="text-right py-1">Op. Inafecta:</td>
                      <td className="text-right py-1 pl-4 font-mono">{formatCurrency(totals.inafecta)}</td>
                    </tr>
                  )}
                  {totals.gratuita > 0 && (
                    <tr>
                      <td className="text-right py-1">Op. Gratuita:</td>
                      <td className="text-right py-1 pl-4 font-mono">{formatCurrency(totals.gratuita)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-right py-1">IGV ({sale.igvPercent || 18}%):</td>
                    <td className="text-right py-1 pl-4 font-mono">{formatCurrency(totals.igv)}</td>
                  </tr>
                  {totals.descuento > 0 && (
                    <tr>
                      <td className="text-right py-1 text-red-600">Descuento:</td>
                      <td className="text-right py-1 pl-4 font-mono text-red-600">- {formatCurrency(totals.descuento)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-800">
                    <td className="text-right py-2 font-bold text-lg">TOTAL:</td>
                    <td className="text-right py-2 pl-4 font-bold text-lg text-blue-600 font-mono">{formatCurrency(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Importe en letras */}
          <div className="mt-4 p-3 bg-gray-50 rounded" style={{ backgroundColor: '#f9fafb' }}>
            <p className="text-sm">
              <span className="font-medium">SON:</span> {numeroALetras(totals.total)}
            </p>
          </div>

          {/* Información adicional */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <p className="font-medium">Condición de pago:</p>
              <p>{sale.paymentCondition || 'CONTADO'}</p>
            </div>
            <div>
              <p className="font-medium">Vendedor:</p>
              <p>{sale.user?.firstName} {sale.user?.lastName}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-xs text-gray-600 text-center">
              <p className="font-medium mb-1">Autorizado mediante Resolución N° 155-2017/SUNAT</p>
              <p>Consulte su comprobante en: www.sunat.gob.pe</p>
              <p className="mt-2">
                {/* Hash: {sale.hash || sale.id.substring(0, 8)}... | Página 1 de 1 */}
                ID: {sale?.id ? String(sale.id).substring(0, 8) : 'N/A'}... | Página 1 de 1
              </p>
            </div>
          </div>

          {/* Información para el emisor */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-400">
            <p className="text-xs text-gray-500 text-center">
              EMISOR - Conservar para control tributario
            </p>
          </div>
        </div>
      </div>
    </>
  );
}