-- Create reports table for user reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Create blocks table for user blocks
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create moderation_logs for tracking flagged content
CREATE TABLE public.moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  toxicity_score DECIMAL(3,2),
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- RLS for reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for blocks
CREATE POLICY "Users can create blocks"
ON public.blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their own blocks"
ON public.blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
ON public.blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- RLS for moderation_logs (admin only)
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert moderation logs"
ON public.moderation_logs FOR INSERT
WITH CHECK (true);