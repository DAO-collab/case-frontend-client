import { IDefaultResponse } from "./default-response.interface";

export interface Todos {
  data: IDefaultResponse<Todo[]> & { startKey: string };
};

interface Todo {
  answers: { [key: string]: string };
  answers_ct: number;
  case_id: string;
  created_on: string;
  due_date: string | Date;
  duration: {
    due_date: string;
  };
  name: string;
  participants_ids: string[];
  published: 0 | 1;
  todo_id: string;
  updated_on: string;
  user_id: string;
};