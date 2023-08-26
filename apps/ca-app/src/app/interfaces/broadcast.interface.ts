export interface Broadcast {
  broadcast_id: string;
  created_on: Date;
  expire_on: Date;
  host_id: string;
  message: string;
  permissions: string[];
  title: string;
  updated_on: Date;
};