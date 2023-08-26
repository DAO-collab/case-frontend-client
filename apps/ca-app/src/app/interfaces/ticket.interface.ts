import { IMedia } from "@app/pages/feeds/models/feed.model";

export interface Ticket {
  comments: TicketComment[];
  comments_ct: number;
  created_by: string;
  created_on: Date;
  expire_on: Date;
  host_id: string;
  media: IMedia;
  media_ct: number;
  message: string;
  status: 0 | 1;
  ticket_id: string;
  title: string;
  updated_on: Date;
};

interface TicketComment {
  created_on: Date;
  message: string;
  user_id: string;
};