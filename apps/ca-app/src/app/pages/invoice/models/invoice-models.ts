export class TransactionsSchema {
  discount?: number | null;
  tax?: number | null;
  transactions?: [
    {
      description: string;
      quantity?: number | null;
      transaction_type: string;
      value: number | null;
    }
  ];
}

export class InvoiceModel {
  invoice_id?: string = '';
  description?: string = '';
  duration = {
    due_date: '',
    rrule: ''
  };
  invoice_number?: string = '';
  name: string = '';
  notes?: string = '';
  notifications?: any = {
    names: [],
    values: []
    //valid: true
  };
  instant_notify = true;
  participants_ids: string[] = [];
  po_number?: string = '';
  published = 0;
  reference_id?: string = '';
  status: string = 'open';
  terms? = '';
  transactions?: TransactionsSchema = {
    discount: null,
    tax: null,
    transactions: [
      {
        description: '',
        quantity: null,
        transaction_type: '',
        value: null
      }
    ]
  };
}
