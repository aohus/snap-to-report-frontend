export interface Job {
  id: string;
  title: string;
  construction_type?: string;
  company_name?: string;
  work_date?: string;
  active_cluster_version_id?: string; // ID of the active cluster version
  status: 'CREATED' | 'UPLOADING' | 'PROCESSING' | 'PENDING' | 'COMPLETED' | 'FAILED'| 'DELETED';
  export_status?: 'PROCESSING' | 'EXPORTED' | 'FAILED' | 'PENDING' ;
  created_at: string;
  updated_at?: string;
}

export interface Photo {
  id: string;
  job_id: string;
  order_index: number;
  cluster_id?: string; // Optional, as it might be in Reserve (null) or a specific cluster
  original_filename: string;
  storage_path: string;
  url: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  timestamp?: string; // ISO string from DateTime
  labels?: Record<string, string>;
}

export interface Member {
  id: string;
  cluster_id: string; // Optional, as it might be in Reserve (null) or a specific cluster
  photo_id: string;
  order_index: number;
  timestamp?: string; // ISO string from DateTime
  labels?: Record<string, string>;
  url: string;
}

export interface Cluster {
  id: string;
  // job_id: string;
  cluster_version_id?: string;
  name: string;
  order_index: number;
  photos: Member[];
}

export interface ExportStatus {
  status: 'PROCESSING' | 'EXPORTED' | 'FAILED' | 'PENDING' ;
  pdf_url: string | null;
  error_message: string | null;
}

// export interface MovePhotoRequest {
//   photo_id: string;
//   target_cluster_id: string;
// }

export interface Token {
  access_token: string;
  token_type: string; // 'bearer'
}

export interface FileResponse {
  path: string;
  filename: string;
  media_type: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  message: string;
  estimated_time?: number;
}