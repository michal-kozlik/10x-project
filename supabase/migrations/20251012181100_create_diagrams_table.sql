-- Migration: Create Diagrams Table
-- Description: Creates the diagrams table for storing user Sudoku diagrams with proper RLS policies
-- Author: Copilot
-- Date: 2025-10-12
-- Tables affected: diagrams
-- Dependencies: auth.users (from supabase auth)

-- Step 1: Create the diagrams table
-- This table stores user-created Sudoku diagrams with their definitions, solutions, and metadata
CREATE TABLE diagrams (
    Id BIGSERIAL PRIMARY KEY,
    Definition VARCHAR(100) NOT NULL CHECK (LENGTH(Definition) = 81), -- 9x9 Sudoku board (81 characters)
    Solution VARCHAR(100) CHECK (Solution IS NULL OR LENGTH(Solution) = 81), -- Optional solution, must be 81 chars if present
    Name VARCHAR(1000), -- Optional diagram name
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
    UserId UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE -- Link to Supabase auth user
);

-- Step 2: Create indexes for performance optimization
-- Index for quick lookups of user's diagrams
CREATE INDEX "IX_Diagrams_UserId" ON diagrams("UserId");

-- Index for chronological sorting
CREATE INDEX "IX_Diagrams_CreatedAt" ON diagrams("CreatedAt");

-- Step 3: Enable Row Level Security
-- This is a critical security measure that must be enabled before adding any data
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- SELECT policy for authenticated users
-- Allows users to view only their own diagrams
CREATE POLICY "Users can view their own diagrams"
ON diagrams
FOR SELECT
TO authenticated
USING (auth.uid() = "UserId");

-- INSERT policy for authenticated users
-- Allows users to create new diagrams under their own user_id
CREATE POLICY "Users can create their own diagrams"
ON diagrams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "UserId");

-- UPDATE policy for authenticated users
-- Allows users to modify only their own diagrams
CREATE POLICY "Users can update their own diagrams"
ON diagrams
FOR UPDATE
TO authenticated
USING (auth.uid() = "UserId")
WITH CHECK (auth.uid() = "UserId");

-- DELETE policy for authenticated users
-- Allows users to delete only their own diagrams
CREATE POLICY "Users can delete their own diagrams"
ON diagrams
FOR DELETE
TO authenticated
USING (auth.uid() = "UserId");

-- Step 5: Create comments for better documentation
COMMENT ON TABLE diagrams IS 'Stores user-created Sudoku diagrams with their definitions and optional solutions';
COMMENT ON COLUMN diagrams."Id" IS 'Unique identifier for the diagram';
COMMENT ON COLUMN diagrams."Definition" IS 'Sudoku diagram definition as a string of 81 characters (9x9 board)';
COMMENT ON COLUMN diagrams."Solution" IS 'Optional solution for the Sudoku diagram (81 characters if present)';
COMMENT ON COLUMN diagrams."Name" IS 'Optional user-provided name for the diagram';
COMMENT ON COLUMN diagrams."CreatedAt" IS 'Timestamp when the diagram was created';
COMMENT ON COLUMN diagrams."UserId" IS 'Reference to the Supabase auth.users table, identifies the diagram owner';

-- Note: The following constraints are enforced:
-- 1. Diagram definitions must be exactly 81 characters (9x9 Sudoku board)
-- 2. Solutions, if provided, must also be exactly 81 characters
-- 3. Names can be up to 1000 characters long
-- 4. Each diagram must be associated with a valid user
-- 5. When a user is deleted, all their diagrams are automatically deleted (ON DELETE CASCADE)
-- 6. Users can only access their own diagrams through RLS policies