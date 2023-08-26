import { CaseStatus } from "@app/types";

export interface Case {
  case_id: string;
  case_tag_id: string;
  name: string;
  status: CaseStatus;
};