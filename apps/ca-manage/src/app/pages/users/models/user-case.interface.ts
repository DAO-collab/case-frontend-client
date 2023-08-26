import { TCaseStatus } from './case-status.interface';

export interface IUserCase {
  case_id: string;
  case_tag_id: string;
  case_status: TCaseStatus;
  case_role_id: string;
}
