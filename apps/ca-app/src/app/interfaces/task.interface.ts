import { TaskStatuses } from "@app/enums";
import { IMedia } from "@app/pages/feeds/models/feed.model";

export interface Task {
  case_id: string;
  created_on: Date;
  description: string;
  due_date: Date;
  duration: {
    due_date: Date;
  };
  encoding_ct: number;
  instant_notify: boolean;
  media: IMedia;
  media_ct: number;
  name: string;
  participants_ids: string[];
  published: 0 | 1;
  responses: { [key: string]: string };
  responses_ct: number;
  status: TaskStatuses;
  subtasks_ct: number;
  task_id: string;
  total_responses_ct: number;
  updated_on: Date;
  user_id: string;
};