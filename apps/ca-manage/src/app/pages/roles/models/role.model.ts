/*
 * Role interface
 */
export interface IRole {
  case_read_fields: string[];
  case_write_fields?: string[];
  file_size: {
    audios: number;
    docs: number;
    files: number;
    images: number;
    videos: number;
  };
  name: string;
  permissions?: {
    [key: string]: string[];
  };
  created_on?: string;
  editLink?: string;
  host_id?: string;
  role_id?: string;
  role_type?: RoleType;
  selfLink?: string;
  updated_on?: string;
  users_ct?: number;
}

/*
 * Role type enum
 */
export enum RoleType {
  System = 'system',
  Custom = 'custom'
}

/*
 * Role search attribute enum
 */
export enum RoleSearchAttribute {
  Name = 'name'
}

export enum RoleLimit {
  Limit = '5'
}
