export interface ProjectTeam {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface ProjectTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'lead' | 'member';
  added_at: string;
  added_by: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface CommentMention {
  id: string;
  comment_id: string;
  mentioned_user_id: string;
  created_at: string;
}
