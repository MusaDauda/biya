-- 1. Create Users Table (Students & Vendors)
CREATE TABLE users (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('student', 'vendor')),
  name text NOT NULL,
  balance numeric DEFAULT 0,
  details jsonb
);

-- 2. Create Transactions Table
CREATE TABLE transactions (
  id text PRIMARY KEY,
  sender_id text REFERENCES users(id),
  receiver_id text REFERENCES users(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  reference text,
  created_at bigint NOT NULL
);

-- 3. Enable RLS (Row Level Security) and allow anon access for prototype
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anon update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow anon insert users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- 4. Insert Seed Data
INSERT INTO users (id, type, name, balance, details) VALUES
('student_1', 'student', 'Musa', 42500, '{}'),
('iya-basira', 'vendor', 'Iya Basira Food', 0, '{"code": "1289041234", "campus": "ABU SAMARU CAMPUS"}'),
('campus-print', 'vendor', 'Campus Print', 0, '{"code": "3312005678", "campus": "ABU SAMARU CAMPUS"}'),
('book-hub', 'vendor', 'Book Hub', 0, '{"code": "5543219012", "campus": "ABU MAIN CAMPUS"}'),
('hostel-gate-bike', 'vendor', 'Hostel Gate Bike', 0, '{"code": "7812359076", "campus": "ABU SAMARU CAMPUS"}'),
('campus-cafe', 'vendor', 'Campus Cafe', 0, '{"code": "9920416830", "campus": "ABU SAMARU CAMPUS"}')
ON CONFLICT (id) DO NOTHING;
