export interface IDefaultResponse<T> {
  currentItemCount: number;
  selfLink: string;
  nextLink?: string;
  items: T;
};