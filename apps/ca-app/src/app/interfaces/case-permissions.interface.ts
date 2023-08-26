import { Host } from "./host.interface";
import { AppPermissions } from "./permissions.interface";

export interface CasePermissions {
  data: {
    host: Host;
    role: {
      case_read_fields: string[];
      case_write_fields: string[];
      file_size: FileSize;
      permissions: AppPermissions;
      role_id: string;
    };
  };
};

interface FileSize {
  audios: number;
  docs: number;
  files: number;
  images: number;
  videos: number;
};