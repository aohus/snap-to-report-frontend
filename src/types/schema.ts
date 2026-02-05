import { z } from 'zod';

export const PhotoSchema = z.object({
  id: z.string(),
  job_id: z.string().optional().nullable(),
  order_index: z.number().optional().nullable(),
  cluster_id: z.string().optional().nullable(),
  original_filename: z.string(),
  storage_path: z.string(),
  url: z.string(),
  thumbnail_url: z.string().optional().nullable(),
  thumbnail_path: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  labels: z.record(z.string()).optional().nullable(),
});

export const MemberSchema = z.object({
  id: z.string(),
  cluster_id: z.string().optional().nullable(),
  photo_id: z.string(),
  order_index: z.number(),
  timestamp: z.string().optional().nullable(),
  labels: z.record(z.string()).optional().nullable(),
  url: z.string(),
});

export const ClusterSchema = z.object({
  id: z.string(),
  cluster_version_id: z.string().optional().nullable(),
  name: z.string(),
  order_index: z.number(),
  photos: z.array(MemberSchema),
});

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  site_id: z.string().optional().nullable(),
  construction_type: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  work_date: z.string().optional().nullable(),
  active_cluster_version_id: z.string().optional().nullable(),
  status: z.enum(['CREATED', 'UPLOADING', 'PROCESSING', 'PENDING', 'COMPLETED', 'FAILED', 'DELETED']),
  export_status: z.enum(['PROCESSING', 'EXPORTED', 'FAILED', 'PENDING']).optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const JobDetailsSchema = JobSchema.extend({
  photos: z.array(PhotoSchema),
  clusters: z.array(ClusterSchema),
});

export const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  jobs: z.array(JobSchema).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
