export interface FormInfo {
  answers: Object;
  answers_ct: number;
  case_id: string;
  created_on: string;
  description: string;
  due_date: string;
  duration: { due_date: string };
  editLink: string;
  encoding_ct: number;
  form_id: string;
  instant_notify: boolean;
  media: Medias;
  media_ct: number;
  name: string;
  notifications: Object;
  pages: Page[];
  pages_ct: number;
  participants_ids: string[];
  published: number;
  secure_answers: boolean;
  selfLink: string;
  type: string;
  updated_on: string;
  user_id: string;
}

export interface Medias {
  audios: Media;
  docs: Media;
  files: Media;
  images: Media;
  videos: Media;
}

interface Page {
  background_id: string;
  schema: { type: string; $schema: string };
  ui_schema: { type: string; elements: unknown[] };
}

interface Media {
  ct: number;
  items: MediaItem[];
}

interface MediaItem {
  [key: string]: {
    content_type: string;
    display_count: number;
    display_formats: string[];
    display_sizes: string[];
    display_start: string;
    etag: string;
    execution_id: string;
    execution_status: 'FAILED' | 'SUCCEEDED' | 'RUNNING';
    media_group: string;
    media_size: number;
    original: string;
    pdf: string;
    source: string;
    tag_id: string;
  };
}
