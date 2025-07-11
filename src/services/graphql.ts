// src/services/graphql.ts
import { API_CONFIG } from '../config/api'

const GRAPHQL_ENDPOINT = API_CONFIG.GRAPHQL_ENDPOINT

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    extensions?: any
  }>
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const token = localStorage.getItem('token')
    
    // LOG PARA DEBUG
    console.log('GraphQL Request:', {
      url: GRAPHQL_ENDPOINT,
      query,
      variables
    })
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    // LOG PARA DEBUG
    console.log('Response status:', response.status)
    
    // Si hay error 400, intentemos ver el body
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result: GraphQLResponse<T> = await response.json()
    
    // LOG PARA DEBUG
    console.log('Response data:', result)

    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    return result.data!
  } catch (error) {
    console.error('GraphQL Error:', error)
    throw error
  }
}

// Mutation para login de empresa
export const COMPANY_LOGIN_MUTATION = `
  mutation CompanyLogin($ruc: String!, $email: String!, $password: String!) {
    companyLogin(ruc: $ruc, email: $email, password: $password) {
      success
      message
      company {
        id
        ruc
        denomination
        email
        phone
        address
        logoBase64
        igvPercentage
        pdfSize
        pdfColor        
        isActive
        isPayment
      }
      logoBase64
      errors
    }
  }
`

// Mutation para login de usuario
export const USER_LOGIN_MUTATION = `
  mutation UserLogin($username: String!, $password: String!, $companyId: ID!) {
    userLogin(username: $username, password: $password, companyId: $companyId) {
      success
      message
      token
      refreshToken
      user {
        id
        username
        email
        phone
        dni
        firstName
        lastName
        company {
            id
            ruc
            denomination
            email
            phone
            address
            igvPercentage
            pdfSize
            pdfColor
            isActive
            isPayment
        }
        isActive
      }
      errors
    }
  }
`

// Función para login de empresa
export const companyLogin = async (ruc: string, email: string, password: string) => {
  console.log('CompanyLogin called with:', { ruc, email, password })
  
  const data = await graphqlRequest<{
    companyLogin: {
      success: boolean
      message: string
      company?: {
        id: string
        denomination: string
        ruc: string
        phone: string
        email: string
        address: string
        logoBase64: string
        igvPercentage: number
        pdfSize: string
        pdfColor: string
        isActive: boolean
        isPayment: boolean        
      }
      logoBase64?: string
      errors?: string[]
    }
  }>(COMPANY_LOGIN_MUTATION, { ruc, email, password })
  if (data.companyLogin.company && data.companyLogin.company.igvPercentage) {
    const igvValue = data.companyLogin.company.igvPercentage
    
    // Convertir a string primero si no lo es
    const igvString = String(igvValue)
    
    // Buscar el patrón A_18, B_10, etc.
    if (igvString.indexOf('_') !== -1) {
      const parts = igvString.split('_')
      if (parts.length > 1) {
        const numericPart = parseInt(parts[1], 10)
        if (!isNaN(numericPart)) {
          data.companyLogin.company.igvPercentage = numericPart
        } else {
          data.companyLogin.company.igvPercentage = 18 // fallback
        }
      }
    } else {
      // Si no tiene guión bajo, intentar convertir directamente
      const numericValue = parseInt(igvString, 10)
      data.companyLogin.company.igvPercentage = isNaN(numericValue) ? 18 : numericValue
    }
  }
  return data.companyLogin
}

// Función para login de usuario
export const userLogin = async (username: string, password: string, companyId: string) => {
  const data = await graphqlRequest<{
    userLogin: {
      success: boolean
      message: string
      token?: string
      refreshToken?: string
      user?: {
        id: string
        username: string
        email: string
        phone: string
        dni: string
        firstName: string
        lastName: string
        isActive: boolean
      }
      company?: {
        id: string
        denomination: string
        ruc: string
        phone: string
        email: string
        address: string
        logoBase64: string
        igvPercentage: number
        pdfSize: string
        pdfColor: string
        isActive: boolean
        isPayment: boolean   
      }
      errors?: string[]
    }
  }>(USER_LOGIN_MUTATION, { username, password, companyId })

  return data.userLogin
}