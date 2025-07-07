// src/services/sales.graphql.ts

// Query para obtener operaciones por fecha
export const GET_OPERATIONS_BY_DATE_QUERY = `
  query GetOperationsByDate($companyId: ID!, $date: String!, $operationType: String!) {
    operationsByDate(companyId: $companyId, date: $date, operationType: $operationType) {
      id
      serial
      number
      operationDate
      emitDate
      emitTime
      operationStatus
      currency
      totalAmount
      totalTaxable
      totalUnaffected
      totalExempt
      totalFree
      igvAmount
      globalDiscount
      globalDiscountPercent
      totalDiscount
      person {
        id
        fullName
        document
        personType
        address
        phone
        email
      }
      document {
        id
        code
        description
      }
      user {
        id
        firstName
        lastName
      }
      details {
        id
        description
        quantity
        unitValue
        unitPrice
        totalValue
        igvAmount
        totalAmount
        discountPercentage
        totalDiscount
        product {
          id
          code
          description
          unitPrice
          typeAffectation {
            code
            name
          }
          unit {
            id
            description
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

// Query para obtener una operación específica con todos sus detalles
export const GET_OPERATION_DETAILS_QUERY = `
  query GetOperationDetails($operationId: ID!) {
    operation(id: $operationId) {
      id
      serial
      number
      operationDate
      emitDate
      emitTime
      operationStatus
      currency
      totalAmount
      totalTaxable
      totalUnaffected
      totalExempt
      totalFree
      igvAmount
      globalDiscount
      globalDiscountPercent
      totalDiscount
      person {
        id
        fullName
        document
        personType
        address
        phone
        email
      }
      document {
        id
        code
        description
      }
      user {
        id
        firstName
        lastName
      }
      company {
        id
        denomination
        ruc
        address
        phone
        email
      }
      details {
        id
        description
        quantity
        unitValue
        unitPrice
        totalValue
        totalIgv
        totalAmount
        discountPercentage
        totalDiscount
        product {
          id
          code
          description
          unitPrice
          typeAffectation {
            code
            name
          }
          unit {
            id
            description
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

// Query para obtener estadísticas de ventas por rango de fechas
export const GET_SALES_STATS_QUERY = `
  query GetSalesStats($companyId: ID!, $startDate: String!, $endDate: String!) {
    salesStats(companyId: $companyId, startDate: $startDate, endDate: $endDate) {
      totalSales
      totalAmount
      totalItems
      avgTicket
      totalTaxable
      igvAmount
      totalDiscount
      salesByDay {
        date
        count
        amount
      }
      topProducts {
        productId
        productCode
        productDescription
        quantity
        amount
      }
      topCustomers {
        personId
        personName
        personDocument
        salesCount
        totalAmount
      }
    }
  }
`

// Mutation para anular una operación
export const CANCEL_OPERATION_MUTATION = `
  mutation CancelOperation($operationId: ID!, $reason: String!) {
    cancelOperation(operationId: $operationId, reason: $reason) {
      success
      message
      operation {
        id
        operationStatus
        lowDate
        sunatDescriptionLow
      }
    }
  }
`

// Query para buscar operaciones con filtros avanzados
export const SEARCH_OPERATIONS_QUERY = `
  query SearchOperations(
    $companyId: ID!
    $operationType: String!
    $startDate: String
    $endDate: String
    $personDocument: String
    $serial: String
    $number: Int
    $status: String
    $limit: Int
    $offset: Int
  ) {
    searchOperations(
      companyId: $companyId
      operationType: $operationType
      startDate: $startDate
      endDate: $endDate
      personDocument: $personDocument
      serial: $serial
      number: $number
      status: $status
      limit: $limit
      offset: $offset
    ) {
      operations {
        id
        serial
        number
        operationDate
        emitDate
        emitTime
        operationStatus
        currency
        totalAmount
        totalTaxable
        igvAmount
        person {
          id
          fullName
          document
          personType
        }
        details {
          id
          quantity
          totalAmount
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
`