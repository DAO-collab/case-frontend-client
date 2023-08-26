import { TaskStatuses } from "@app/enums/task-statuses.enum";

export interface Subtask {
  case_id: string;
  due_date: Date;
  encoding_ct: number;
  media_ct: number;
  name: string;
  participants_ids: string[];
  published: 0 | 1;
  responses: { [key: string]: string };
  responses_ct: number;
  subtask_id: string;
  task_id: string;
  total_responses_ct: number;
  status?: TaskStatuses;
};