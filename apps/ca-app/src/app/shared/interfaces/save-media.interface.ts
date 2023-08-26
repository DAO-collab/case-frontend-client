export interface SaveMedia {
  data: {
    editLink: string;
    currentItemCount: number;
    selfLink: string;
    items: {
      media_key: string;
      media_id: string;
    }[];
  };
}
