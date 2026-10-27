-- ========================================================
-- SUBSHARE SERVICES DATABASE TABLES & RLS POLICIES
-- Copy and run this script in the Supabase SQL Editor
-- ========================================================

-- 1. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT,
  venue TEXT,
  event_date DATE,
  event_time TIME,
  seat_number TEXT,
  quantity INT NOT NULL,
  original_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  transfer_method TEXT,
  proof_image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE,
  departure_time TIME,
  available_seats INT,
  total_seats INT,
  price_per_person DECIMAL(10,2),
  vehicle_type TEXT,
  gender_preference TEXT DEFAULT 'anyone',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blood_group TEXT NOT NULL,
  units_needed INT NOT NULL,
  hospital_name TEXT,
  hospital_location TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  reason TEXT,
  urgency TEXT DEFAULT 'normal',
  required_before TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Food Donations Table
CREATE TABLE IF NOT EXISTS food_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_type TEXT NOT NULL,
  is_vegetarian BOOLEAN,
  meals_count INT,
  cooked_time TIMESTAMPTZ,
  pickup_deadline TIMESTAMPTZ,
  pickup_location TEXT,
  description TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscription Groups Table
CREATE TABLE IF NOT EXISTS subscription_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  plan_type TEXT,
  max_members INT,
  current_members INT DEFAULT 1,
  monthly_share DECIMAL(10,2),
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date DATE,
  is_private BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Service Requests Table (cross-service)
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  listing_id UUID NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- RLS Policies for Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickets active viewable by all" ON tickets FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tickets" ON tickets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rides active viewable by all" ON rides FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own rides" ON rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rides" ON rides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rides" ON rides FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Blood Requests
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blood requests active viewable by all" ON blood_requests FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own blood requests" ON blood_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blood requests" ON blood_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blood requests" ON blood_requests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Food Donations
ALTER TABLE food_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Food donations active viewable by all" ON food_donations FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own food donations" ON food_donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food donations" ON food_donations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food donations" ON food_donations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Subscription Groups
ALTER TABLE subscription_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription groups active viewable by all" ON subscription_groups FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);
CREATE POLICY "Users can insert own subscription groups" ON subscription_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own subscription groups" ON subscription_groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own subscription groups" ON subscription_groups FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for Service Requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view requests they are part of" ON service_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users insert service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update requests they are part of" ON service_requests FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
