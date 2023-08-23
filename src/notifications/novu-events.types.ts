export enum NovuEvent {
  RECOVERY_PASSWORD_CODE = 'recovery-password-code',
  INVOICES_DUE_TODAY = 'invoices-due-today',
}

export type InvoicesDueTodayNotificationPayload = {
  customerName: string
  customerCode: number
  customerPendingInvoices: number
  customerEmail: string
  customerPhone: string
  invoices: {
    order: string
    deposited: string
    total: string
    toPay: string
    items: {
      productName: string
      requested: number
      price: string
      salePrice: string
      discount: number | null
    }[]
  }[]
}
