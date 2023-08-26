/**
 * API Response model.
 */
export interface IApiGridResponse<T> {
  currentItemCount: number;
  items: T;
  selfLink: string;
}
