export interface AddComment {
  message: string;
};

export interface AddCommentResponse {
  case_id: string;
  comment_id: string;
  selfLink: string;
  editLink: string;
};

export interface DeleteCommentRequest {
  case_id: string;
  parent_id: string;
  post_id: string;
};