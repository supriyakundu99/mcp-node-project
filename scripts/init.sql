-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS student_schema;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_students_updated_at ON student_schema.students;
DROP TRIGGER IF EXISTS update_student_marks_updated_at ON student_schema.student_marks;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS student_schema.update_updated_at_column();

-- Create tables
CREATE TABLE IF NOT EXISTS student_schema.students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) NOT NULL,
    department VARCHAR(50) NOT NULL,
    class_year INTEGER NOT NULL CHECK (class_year BETWEEN 1 AND 4),
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraints if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_roll_number_key' 
        AND conrelid = 'student_schema.students'::regclass
    ) THEN
        ALTER TABLE student_schema.students ADD CONSTRAINT students_roll_number_key UNIQUE (roll_number);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_email_key' 
        AND conrelid = 'student_schema.students'::regclass
    ) THEN
        ALTER TABLE student_schema.students ADD CONSTRAINT students_email_key UNIQUE (email);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS student_schema.student_marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    subject VARCHAR(50) NOT NULL,
    marks INTEGER CHECK (marks BETWEEN 0 AND 100),
    semester INTEGER CHECK (semester BETWEEN 1 AND 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_marks_student_id_fkey' 
        AND conrelid = 'student_schema.student_marks'::regclass
    ) THEN
        ALTER TABLE student_schema.student_marks 
        ADD CONSTRAINT student_marks_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES student_schema.students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION student_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamp
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON student_schema.students
    FOR EACH ROW
    EXECUTE FUNCTION student_schema.update_updated_at_column();

CREATE TRIGGER update_student_marks_updated_at
    BEFORE UPDATE ON student_schema.student_marks
    FOR EACH ROW
    EXECUTE FUNCTION student_schema.update_updated_at_column();

-- Truncate existing data to avoid duplicates on re-run
TRUNCATE TABLE student_schema.student_marks CASCADE;
TRUNCATE TABLE student_schema.students CASCADE;

-- Insert sample student data
INSERT INTO student_schema.students (name, roll_number, department, class_year, email) VALUES
('Rahul Sharma', 'CSE001', 'Computer Science', 3, 'rahul.s@example.com'),
('Priya Patel', 'ECE001', 'Electronics', 2, 'priya.p@example.com'),
('Amit Kumar', 'CSE002', 'Computer Science', 3, 'amit.k@example.com'),
('Sneha Gupta', 'ME001', 'Mechanical', 1, 'sneha.g@example.com'),
('Raj Malhotra', 'CSE003', 'Computer Science', 4, 'raj.m@example.com'),
('Neha Singh', 'ECE002', 'Electronics', 2, 'neha.s@example.com'),
('Vikram Verma', 'ME002', 'Mechanical', 3, 'vikram.v@example.com'),
('Anjali Desai', 'CSE004', 'Computer Science', 1, 'anjali.d@example.com'),
('Suresh Kumar', 'ECE003', 'Electronics', 4, 'suresh.k@example.com'),
('Meera Reddy', 'ME003', 'Mechanical', 2, 'meera.r@example.com'),
('Arjun Nair', 'CSE005', 'Computer Science', 3, 'arjun.n@example.com'),
('Pooja Shah', 'ECE004', 'Electronics', 1, 'pooja.s@example.com'),
('Kiran Rao', 'ME004', 'Mechanical', 4, 'kiran.r@example.com'),
('Arun Joshi', 'CSE006', 'Computer Science', 2, 'arun.j@example.com'),
('Divya Kapoor', 'ECE005', 'Electronics', 3, 'divya.k@example.com'),
('Sanjay Mehta', 'ME005', 'Mechanical', 1, 'sanjay.m@example.com'),
('Ritu Sharma', 'CSE007', 'Computer Science', 4, 'ritu.s@example.com'),
('Alok Menon', 'ECE006', 'Electronics', 2, 'alok.m@example.com'),
('Maya Pillai', 'ME006', 'Mechanical', 3, 'maya.p@example.com'),
('Deepak Iyer', 'CSE008', 'Computer Science', 1, 'deepak.i@example.com');

-- Insert sample marks data (multiple subjects per student)
INSERT INTO student_schema.student_marks (student_id, subject, marks, semester) 
SELECT 
    s.id,
    subject,
    floor(random() * 31 + 70)::int, -- Random marks between 70 and 100
    semester
FROM student_schema.students s
CROSS JOIN (
    VALUES 
        ('Mathematics', 1),
        ('Physics', 1),
        ('Programming', 2),
        ('Database Systems', 3),
        ('Operating Systems', 4),
        ('Computer Networks', 5)
) AS subjects(subject, semester)
WHERE s.department = 'Computer Science';

INSERT INTO student_schema.student_marks (student_id, subject, marks, semester)
SELECT 
    s.id,
    subject,
    floor(random() * 31 + 70)::int,
    semester
FROM student_schema.students s
CROSS JOIN (
    VALUES 
        ('Circuit Theory', 1),
        ('Electronics', 1),
        ('Digital Systems', 2),
        ('Microprocessors', 3),
        ('Communication Systems', 4),
        ('Signal Processing', 5)
) AS subjects(subject, semester)
WHERE s.department = 'Electronics';

INSERT INTO student_schema.student_marks (student_id, subject, marks, semester)
SELECT 
    s.id,
    subject,
    floor(random() * 31 + 70)::int,
    semester
FROM student_schema.students s
CROSS JOIN (
    VALUES 
        ('Engineering Mechanics', 1),
        ('Thermodynamics', 1),
        ('Fluid Mechanics', 2),
        ('Machine Design', 3),
        ('Heat Transfer', 4),
        ('Manufacturing Processes', 5)
) AS subjects(subject, semester)
WHERE s.department = 'Mechanical'; 