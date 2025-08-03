-- Supabaseでquestionsテーブルを作成するSQL
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  majorCategory TEXT NOT NULL DEFAULT '',
  minorCategory TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) を有効化
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーが読み書きできるポリシーを作成（匿名アクセス対応）
CREATE POLICY "Allow all operations for everyone" ON questions
FOR ALL USING (true) WITH CHECK (true);

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_questions_major_category ON questions(majorCategory);
CREATE INDEX IF NOT EXISTS idx_questions_minor_category ON questions(minorCategory);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
