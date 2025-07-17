// src/services/printService.ts
import ReactDOMServer from 'react-dom/server'
import InvoicePDF from '../pages/components/InvoicePDF'

interface PrintOptions {
  format: 'A' | 'T'
  color?: string
}

interface PrintResult {
  success: boolean
  error?: string
  showDialog?: boolean
}

export class PrintService {
  /**
   * Genera el HTML completo para impresión
   */
  private static generatePrintHTML(sale: any, company: any): string {
    // Renderizar el componente a HTML string
    const componentHTML = ReactDOMServer.renderToStaticMarkup(
      InvoicePDF({ sale, company })
    )

    // Envolver en un documento HTML completo
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${sale.serial}-${sale.number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
            color: #1f2937;
            background: white;
          }
          
          /* Estilos base para impresión */
          @media print {
            @page {
              ${company?.pdfSize === 'T' ? `
                size: 80mm auto;
                margin: 2mm;
              ` : `
                size: A4;
                margin: 12mm;
              `}
            }
            
            body {
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          /* Estilos de Tailwind necesarios (convertidos a CSS puro) */
          .bg-white { background-color: white; }
          .text-white { color: white; }
          .font-bold { font-weight: 700; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-lg { font-size: 1.125rem; }
          .text-xl { font-size: 1.25rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-3 { margin-top: 0.75rem; }
          .mt-4 { margin-top: 1rem; }
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .rounded { border-radius: 0.25rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .rounded-full { border-radius: 9999px; }
          .border { border-width: 1px; }
          .border-2 { border-width: 2px; }
          .border-gray-100 { border-color: #f3f4f6; }
          .border-gray-200 { border-color: #e5e7eb; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-slate-200 { border-color: #e2e8f0; }
          .border-blue-500 { border-color: #3b82f6; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-blue-600 { background-color: #2563eb; }
          .bg-orange-50 { background-color: #fff7ed; }
          .bg-yellow-50 { background-color: #fefce8; }
          .bg-emerald-50 { background-color: #ecfdf5; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5556; }
          .text-gray-700 { color: #374151; }
          .text-gray-800 { color: #1f2937; }
          .text-gray-900 { color: #111827; }
          .text-blue-600 { color: #2563eb; }
          .text-blue-700 { color: #1d4ed8; }
          .text-orange-700 { color: #c2410c; }
          .text-emerald-600 { color: #059669; }
          .text-red-600 { color: #dc2626; }
          .text-slate-300 { color: #cbd5e1; }
          .text-slate-500 { color: #64748b; }
          .text-slate-700 { color: #334155; }
          .text-slate-900 { color: #0f172a; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
          .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
          .flex { display: flex; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .gap-2 { gap: 0.5rem; }
          .gap-3 { gap: 0.75rem; }
          .gap-4 { gap: 1rem; }
          .space-x-2 > * + * { margin-left: 0.5rem; }
          .space-x-3 > * + * { margin-left: 0.75rem; }
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .justify-between { justify-content: space-between; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.025em; }
          .tracking-wide { letter-spacing: 0.025em; }
          .leading-tight { line-height: 1.25; }
          .w-full { width: 100%; }
          .h-px { height: 1px; }
          .h-20 { height: 5rem; }
          .w-20 { width: 5rem; }
          .w-12 { width: 3rem; }
          .w-16 { width: 4rem; }
          .h-16 { height: 4rem; }
          .w-24 { width: 6rem; }
          .h-24 { height: 6rem; }
          .max-w-xs { max-width: 20rem; }
          .overflow-hidden { overflow: hidden; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .top-0 { top: 0; }
          .right-0 { right: 0; }
          .opacity-10 { opacity: 0.1; }
          .transform { transform: translateZ(0); }
          .translate-x-12 { transform: translateX(3rem); }
          .-translate-y-12 { transform: translateY(-3rem); }
          .transition-all { transition: all 0.15s; }
          .backdrop-blur-sm { backdrop-filter: blur(4px); }
          
          /* Gradientes */
          .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
          .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
          .from-slate-900 { --tw-gradient-from: #0f172a; }
          .from-slate-800 { --tw-gradient-from: #1e293b; }
          .via-slate-800 { --tw-gradient-via: #1e293b; }
          .via-slate-700 { --tw-gradient-via: #334155; }
          .to-slate-900 { --tw-gradient-to: #0f172a; }
          .to-slate-700 { --tw-gradient-to: #334155; }
          
          /* Estilos específicos para impresión */
          .print-container-a4,
          .print-container-ticket {
            background: white !important;
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
          
          /* Ticket específico */
          .ticket-container {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
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
          
          .ticket-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .ticket-table td {
            padding: 1mm 0;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        ${componentHTML}
      </body>
      </html>
    `

    return fullHTML
  }

  /**
   * Imprime una venta de forma silenciosa
   */
  static async printSale(sale: any, company: any): Promise<PrintResult> {
    try {
      // Verificar si estamos en Electron
      if (!window.electronAPI?.print) {
        console.warn('API de impresión no disponible')
        return { success: false, error: 'API de impresión no disponible' }
      }

      // Generar el HTML para imprimir
      const printHTML = this.generatePrintHTML(sale, company)

      // Opciones de impresión
      const options: PrintOptions = {
        format: company?.pdfSize || 'A',
        color: company?.pdfColor || '#1e293b'
      }

      // Intentar impresión silenciosa primero
      const result = await window.electronAPI.print.silentPrint(printHTML, options)

      // Si falla y sugiere mostrar diálogo, intentar con diálogo
      if (!result.success && result.showDialog) {
        console.log('Impresión silenciosa falló, mostrando diálogo...')
        return await window.electronAPI.print.printWithDialog(printHTML, options)
      }

      return result
    } catch (error) {
      console.error('Error en printSale:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Obtiene las impresoras disponibles
   */
  static async getAvailablePrinters(): Promise<any[]> {
    try {
      if (!window.electronAPI?.print) {
        return []
      }

      return await window.electronAPI.print.getPrinters()
    } catch (error) {
      console.error('Error obteniendo impresoras:', error)
      return []
    }
  }
}