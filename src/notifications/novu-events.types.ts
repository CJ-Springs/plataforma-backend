export enum NovuEvent {
  RECOVERY_PASSWORD_CODE = 'recovery-password-code',
  INVOICES_DUE_TODAY = 'invoices-due-today',
}

export type InvoicesDueTodayPayload = {
  customerName: string
  customerCode: number
  customerPendingInvoices: number
  customerEmail: string
  customerPhone: string
  invoices: {
    deposited: number
    total: number
    toPay: number
    items: {
      productName: string
      requested: number
      price: number
      salePrice: number
      discount: number | null
    }[]
  }[]
}
