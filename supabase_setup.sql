-- SQL queries to create tables in Supabase for BOLT file sharing app

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    code VARCHAR(6) NOT NULL UNIQUE,
    password TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_code ON files(code);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for files table
CREATE POLICY "Anyone can read files" ON files
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own files" ON files
    FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own files" ON files
    FOR UPDATE USING (user_id IS NULL OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own files" ON files
    FOR DELETE USING (user_id IS NULL OR auth.uid()::text = user_id::text);