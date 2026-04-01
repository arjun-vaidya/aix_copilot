-- Create custom ENUM types
CREATE TYPE role_enum AS ENUM ('student', 'instructor');
CREATE TYPE difficulty_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE execution_mode_enum AS ENUM ('simulation', 'test');
CREATE TYPE execution_status_enum AS ENUM ('PASS', 'FAIL');
CREATE TYPE audit_category_enum AS ENUM ('Syntax', 'Logic', 'UnitMismatch', 'Hallucination');
CREATE TYPE chat_role_enum AS ENUM ('user', 'assistant');

-- TABLE: profiles
-- Mirrors the Supabase auth.users table for application logic.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role role_enum DEFAULT 'student'::role_enum NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::public.role_enum, 'student'::public.role_enum)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TABLE: courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    instructor_id UUID REFERENCES profiles(id) NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, course_id)
);

-- TABLE: problem_sets
CREATE TABLE problem_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty difficulty_enum NOT NULL,
    description TEXT NOT NULL,
    objective_placeholder TEXT,
    constraint_placeholder TEXT,
    approach_placeholder TEXT,
    initial_code TEXT,
    unit_test_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: iterations (Core Telemetry)
CREATE TABLE iterations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    iteration_number INTEGER NOT NULL,
    code_snapshot TEXT NOT NULL,
    objective_text TEXT NOT NULL,
    constraint_text TEXT NOT NULL,
    approach_text TEXT NOT NULL,
    execution_mode execution_mode_enum NOT NULL,
    execution_status execution_status_enum NOT NULL,
    stdout TEXT,
    stderr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: manual_audits (Failed Runs)
CREATE TABLE manual_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iteration_id UUID REFERENCES iterations(id) ON DELETE CASCADE,
    category audit_category_enum NOT NULL,
    student_rationale TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: verification_logs (Passed Runs)
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iteration_id UUID REFERENCES iterations(id) ON DELETE CASCADE,
    reasoning_log TEXT NOT NULL,
    constraint_validation TEXT NOT NULL,
    limit_check TEXT NOT NULL,
    reasoning_score FLOAT, -- Populated later by the AI Scorer middleware
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: copilot_chats
CREATE TABLE copilot_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    role chat_role_enum NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_chats ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile.
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Profiles: Users can update their own profile.
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Problem Sets: Students can view problem sets for their enrolled courses
CREATE POLICY "Students can view enrolled problem sets" ON problem_sets
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments WHERE student_id = auth.uid()
        )
    );

-- Iterations: Submissions are strictly isolated to the student who created them
CREATE POLICY "Students can view own iterations" ON iterations
    FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own iterations" ON iterations
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Chats: Copilot chats isolated to student
CREATE POLICY "Students can view own chats" ON copilot_chats
    FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own chats" ON copilot_chats
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Remaining table isolation
CREATE POLICY "Students can view/insert own audits" ON manual_audits
    FOR ALL USING (
        iteration_id IN (SELECT id FROM iterations WHERE student_id = auth.uid())
    );

CREATE POLICY "Students can view/insert own verifications" ON verification_logs
    FOR ALL USING (
        iteration_id IN (SELECT id FROM iterations WHERE student_id = auth.uid())
    );
