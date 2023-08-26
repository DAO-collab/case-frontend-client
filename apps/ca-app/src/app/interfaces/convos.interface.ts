export interface GetConvo {
  audio_only: boolean;
  case_id: string;
  comments_ct: number;
  convo_id: string;
  convo_type: string;
  created_on: string;
  duration: string;
  editLink: string;
  encoding_ct: number;
  host_id: string;
  media_region: string;
  media_uri: string;
  participants: unknown[];
  participants_ct: number;
  recorded: boolean;
  recording_permissions: string[];
  room_id: string;
  selfLink: string;
  status: string;
  updated_on: string;
  user_id: string;
};

export interface JoinConvo {
  editLink: string;
  selfLink: string;
  token: string;
};