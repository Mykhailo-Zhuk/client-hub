export type ProjectStatus = "active" | "completed" | "paused";

export interface Project {
  id: string;
  client: string;
  clientEmail?: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  dayCurrent?: number;
  dayTotal?: number;
  startDate: string;
  estimatedEnd?: string;
  completedDate?: string;
  tags: string[];
  github?: string;
  demo?: string;
  cover?: string;
}

export type CommentType =
  | "status_update"
  | "milestone"
  | "bug_fix"
  | "deploy"
  | "general"
  | "feedback"
  | "client_reply";

export interface Comment {
  id: string;
  projectId: string;
  type: CommentType;
  message: string;
  author: string;
  timestamp: string;
}

export interface Session {
  token: string;
  email: string;
  projectId: string;
  createdAt: string;
}

export interface ProjectRequest {
  id: string;
  project_id: string;
  text: string;
  status: 'pending' | 'fulfilled';
  created_at: string;
  response_text?: string | null;
  responded_at?: string | null;
}