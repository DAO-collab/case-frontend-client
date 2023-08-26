import { IFeed } from '../pages/feeds/models/feed.model';

export class FeedsListResponse {
  currentItemCount?: number;
  selfLink?: string;
  items?: IFeed[];
}
