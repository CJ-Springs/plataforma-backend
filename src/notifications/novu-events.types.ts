export enum NovuEvent {
  RECOVERY_PASSWORD_CODE = 'recovery-password-code',
  INVOICES_DUE_TODAY = 'invoices-due-today',
  EMPTY_INVOICES_DUE_TODAY = 'empty-invoices-due-today',
}

export type InvoicesDueTodayNotificationPayload = {
  customerName: string
  customerCode: number
  customerPendingInvoices: number
  customerEmail: string
  customerPhone: string
  invoices: {
    order: number
    deposited: string
    total: string
    toPay: string
    href: string
    items: {
      productName: string
      requested: number
      price: string
      salePrice: string
      discount: number | null
    }[]
  }[]
}
