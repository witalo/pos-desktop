// src/services/pos.graphql.ts

export const SEARCH_PERSONS_ADVANCED_QUERY = `
  query SearchPersonsAdvanced($search: String!, $limit: Int) {
    searchPersonsAdvanced(search: $search, limit: $limit) {
      id
      document
      fullName
      personType
      address
      phone
      email
      isCustomer
      isSupplier
    }
  }
`

// Actualiza también la mutation para crear operación
export const CREATE_OPERATION_MUTATION = `
  mutation CreateOperation(
    $documentId: ID
    $serialId: ID
    $operationType: String!
    $operationDate: String!
    $serial: String
    $number: Int
    $emitDate: String!
    $emitTime: String!
    $personId: ID
    $userId: ID!
    $companyId: ID!
    $currency: String
    $globalDiscountPercent: Float
    $globalDiscount: Float
    $totalDiscount: Float
    $igvPercent: Float
    $igvAmount: Float!
    $totalTaxable: Float
    $totalUnaffected: Float
    $totalExempt: Float
    $totalFree: Float
    $totalAmount: Float!
    $items: [OperationDetailInput]!
  ) {
    createOperation(
      documentId: $documentId
      serialId: $serialId
      operationType: $operationType
      operationDate: $operationDate
      serial: $serial
      number: $number
      emitDate: $emitDate
      emitTime: $emitTime
      personId: $personId
      userId: $userId
      companyId: $companyId
      currency: $currency
      globalDiscountPercent: $globalDiscountPercent
      globalDiscount: $globalDiscount
      totalDiscount: $totalDiscount
      igvPercent: $igvPercent
      igvAmount: $igvAmount
      totalTaxable: $totalTaxable
      totalUnaffected: $totalUnaffected
      totalExempt: $totalExempt
      totalFree: $totalFree
      totalAmount: $totalAmount
      items: $items
    ) {
      success
      message
      operation {
        id
        serial
        number
      }
    }
  }
`