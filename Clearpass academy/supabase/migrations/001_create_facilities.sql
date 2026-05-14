CREATE TABLE facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'essentials' CHECK (plan IN ('essentials','command','network')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'trialing' CHECK (subscription_status IN ('active','trialing','canceled','past_due')),
  max_staff integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);
