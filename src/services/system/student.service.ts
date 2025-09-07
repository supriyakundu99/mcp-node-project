import { query } from "../../db";

interface Student {
  id?: number;
  name: string;
  roll_number: string;
  department: string;
  class_year: number;
  email: string;
}

interface StudentMarks {
  id?: number;
  student_id: number;
  subject: string;
  marks: number;
  semester: number;
}

export class StudentService {
  // Get Student Statistics
  async getStudentStatistics() {
    const [byDeptAndClass, byDept, byClass, total] = await Promise.all([
      query(
        "SELECT department, class_year, COUNT(*) as count FROM student_schema.students GROUP BY department, class_year"
      ),
      query(
        "SELECT department, COUNT(*) as count FROM student_schema.students GROUP BY department"
      ),
      query(
        "SELECT class_year, COUNT(*) as count FROM student_schema.students GROUP BY class_year"
      ),
      query("SELECT COUNT(*) as total_count FROM student_schema.students"),
    ]);

    return {
      byDepartmentAndClass: byDeptAndClass.rows,
      byDepartment: byDept.rows,
      byClassYear: byClass.rows,
      totalStudents: total.rows[0].total_count,
    };
  }

  // Get total number of students
  async getTotalStudents() {
    const result = await query("SELECT COUNT(*) as total_count FROM student_schema.students");
    return parseInt(result.rows[0].total_count);
  }

  // Student CRUD operations
  async createStudent(student: Student) {
    const { name, roll_number, department, class_year, email } = student;
    const result = await query(
      "INSERT INTO student_schema.students (name, roll_number, department, class_year, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, roll_number, department, class_year, email]
    );
    return result.rows[0];
  }

  async getStudent(id: number) {
    const result = await query(
      "SELECT * FROM student_schema.students WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  async updateStudent(id: number, student: Partial<Student>) {
    const fields = Object.keys(student);
    const values = Object.values(student);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const result = await query(
      `UPDATE student_schema.students SET ${setClause} WHERE id = $${
        fields.length + 1
      } RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  async deleteStudent(id: number) {
    const result = await query(
      "DELETE FROM student_schema.students WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Marks CRUD operations
  async addMarks(marks: StudentMarks) {
    const { student_id, subject, marks: score, semester } = marks;
    const result = await query(
      "INSERT INTO student_schema.student_marks (student_id, subject, marks, semester) VALUES ($1, $2, $3, $4) RETURNING *",
      [student_id, subject, score, semester]
    );
    return result.rows[0];
  }

  async updateMarks(id: number, marks: Partial<StudentMarks>) {
    const fields = Object.keys(marks);
    const values = Object.values(marks);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const result = await query(
      `UPDATE student_schema.student_marks SET ${setClause} WHERE id = $${
        fields.length + 1
      } RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  async deleteMarks(id: number) {
    const result = await query(
      "DELETE FROM student_schema.student_marks WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Search operations
  async searchStudentsByName(name: string) {
    const result = await query(
      "SELECT * FROM student_schema.students WHERE name ILIKE $1",
      [`%${name}%`]
    );
    return result.rows;
  }

  async searchStudentsByDepartment(department: string) {
    const result = await query(
      "SELECT * FROM student_schema.students WHERE department = $1",
      [department]
    );
    return result.rows;
  }

  async searchStudentsByClass(class_year: number) {
    const result = await query(
      "SELECT * FROM student_schema.students WHERE class_year = $1",
      [class_year]
    );
    return result.rows;
  }

  async searchStudentsByMarksRange(min: number, max: number) {
    const result = await query(
      `SELECT DISTINCT s.* 
             FROM student_schema.students s 
             JOIN student_schema.student_marks sm ON s.id = sm.student_id 
             WHERE sm.marks BETWEEN $1 AND $2`,
      [min, max]
    );
    return result.rows;
  }

  async getStudentMarks(student_id: number) {
    const result = await query(
      `SELECT sm.*, s.name, s.roll_number 
             FROM student_schema.student_marks sm 
             JOIN student_schema.students s ON s.id = sm.student_id 
             WHERE student_id = $1`,
      [student_id]
    );
    return result.rows;
  }

  async getStudentsAboveMarks(marks: number) {
    const result = await query(
      `SELECT DISTINCT s.* 
             FROM student_schema.students s 
             JOIN student_schema.student_marks sm ON s.id = sm.student_id 
             WHERE sm.marks > $1`,
      [marks]
    );
    return result.rows;
  }

  async getStudentsBelowMarks(marks: number) {
    const result = await query(
      `SELECT DISTINCT s.* 
             FROM student_schema.students s 
             JOIN student_schema.student_marks sm ON s.id = sm.student_id 
             WHERE sm.marks < $1`,
      [marks]
    );
    return result.rows;
  }
}
