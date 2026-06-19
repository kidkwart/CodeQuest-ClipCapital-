-- ACADEMY CONTENT
CREATE TABLE public.academy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. 'Finance', 'Operations', 'Marketing'
  content TEXT NOT NULL, -- The actual text or markdown
  score_reward INT DEFAULT 5, -- Points added to ClipScore upon completion
  estimated_time INT, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACADEMY PROGRESS
CREATE TABLE public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.academy_content(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

GRANT SELECT ON public.academy_content TO authenticated;
GRANT SELECT, INSERT ON public.academy_progress TO authenticated;

ALTER TABLE public.academy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view content" ON public.academy_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can track their own progress" ON public.academy_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRIGGER TO BOOST CLIPSCORE ON COMPLETION
CREATE OR REPLACE FUNCTION public.reward_academy_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward INT;
BEGIN
  SELECT score_reward INTO v_reward FROM public.academy_content WHERE id = NEW.content_id;

  UPDATE public.profiles
  SET clip_score = clip_score + v_reward
  WHERE id = NEW.user_id;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_academy_completed
  AFTER INSERT ON public.academy_progress
  FOR EACH ROW EXECUTE FUNCTION public.reward_academy_completion();

-- SEED DATA
INSERT INTO public.academy_content (title, description, category, content, score_reward, estimated_time) VALUES
('Basics of Bookkeeping', 'Learn how to track your daily sales and expenses effectively.', 'Finance', 'Keep a record of every sale...', 10, 5),
('Customer Loyalty 101', 'How to keep your clients coming back to your shop.', 'Marketing', 'Great service starts with...', 5, 3),
('Managing Your Loans', 'Understanding interest and repayment schedules.', 'Finance', 'Loans are tools for growth...', 15, 8);
