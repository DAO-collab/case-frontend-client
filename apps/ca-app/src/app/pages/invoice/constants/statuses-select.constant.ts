import { IStatusSelect } from '../models/status-select.model';

export const CREATE_STATUS_SELECT: IStatusSelect[] = [{ id: 'open', text: 'Open' }];

export const PAID_VOID_STATUS_SELECT: IStatusSelect[] = [
  { id: 'paid', text: 'Paid' },
  { id: 'void', text: 'Void' }
];

export const PUBLISHED_STATUS_SELECT: IStatusSelect[] = [
  { id: 'open', text: 'Open' },
  { id: 'paid', text: 'Paid' },
  { id: 'void', text: 'Void' },
  { id: 'uncollectible', text: 'Uncollectible' },
  { id: 'processing', text: 'Processing' }
];
