import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { IncomingMessage, ServerResponse } from "http";
import { StudentService } from "../services/student.service";

const studentMcpServer = new McpServer({
  name: "student-mcp",
  version: "1.0.0",
});

const studentService = new StudentService();

// Student CRUD operations
studentMcpServer.tool(
  "createStudent",
  {
    name: z.string(),
    roll_number: z.string(),
    department: z.string(),
    class_year: z.number(),
    email: z.string().email(),
  },
  async ({ name, roll_number, department, class_year, email }) => {
    const student = await studentService.createStudent({
      name,
      roll_number,
      department,
      class_year,
      email,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(student) }],
    };
  }
);

studentMcpServer.tool(
  "getStudent",
  {
    id: z.number(),
  },
  async ({ id }) => {
    const student = await studentService.getStudent(id);
    return {
      content: [{ type: "text", text: JSON.stringify(student) }],
    };
  }
);

studentMcpServer.tool(
  "updateStudent",
  {
    id: z.number(),
    data: z.object({
      name: z.string().optional(),
      roll_number: z.string().optional(),
      department: z.string().optional(),
      class_year: z.number().optional(),
      email: z.string().email().optional(),
    }),
  },
  async ({ id, data }) => {
    const student = await studentService.updateStudent(id, data);
    return {
      content: [{ type: "text", text: JSON.stringify(student) }],
    };
  }
);

studentMcpServer.tool(
  "deleteStudent",
  {
    id: z.number(),
  },
  async ({ id }) => {
    const student = await studentService.deleteStudent(id);
    return {
      content: [{ type: "text", text: JSON.stringify(student) }],
    };
  }
);

// Marks operations
studentMcpServer.tool(
  "addMarks",
  {
    student_id: z.number(),
    subject: z.string(),
    marks: z.number(),
    semester: z.number(),
  },
  async ({ student_id, subject, marks, semester }) => {
    const result = await studentService.addMarks({
      student_id,
      subject,
      marks,
      semester,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

studentMcpServer.tool(
  "updateMarks",
  {
    id: z.number(),
    data: z.object({
      subject: z.string().optional(),
      marks: z.number().optional(),
      semester: z.number().optional(),
    }),
  },
  async ({ id, data }) => {
    const result = await studentService.updateMarks(id, data);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// Search operations
studentMcpServer.tool(
  "searchStudentsByName",
  {
    name: z.string(),
  },
  async ({ name }) => {
    const students = await studentService.searchStudentsByName(name);
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

studentMcpServer.tool(
  "searchStudentsByDepartment",
  {
    department: z.string(),
  },
  async ({ department }) => {
    const students = await studentService.searchStudentsByDepartment(
      department
    );
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

studentMcpServer.tool(
  "searchStudentsByClass",
  {
    class_year: z.number(),
  },
  async ({ class_year }) => {
    const students = await studentService.searchStudentsByClass(class_year);
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

studentMcpServer.tool(
  "searchStudentsByMarksRange",
  {
    min: z.number(),
    max: z.number(),
  },
  async ({ min, max }) => {
    const students = await studentService.searchStudentsByMarksRange(min, max);
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

studentMcpServer.tool(
  "getStudentMarks",
  {
    student_id: z.number(),
  },
  async ({ student_id }) => {
    const marks = await studentService.getStudentMarks(student_id);
    return {
      content: [{ type: "text", text: JSON.stringify(marks) }],
    };
  }
);

studentMcpServer.tool(
  "getStudentsAboveMarks",
  {
    marks: z.number(),
  },
  async ({ marks }) => {
    const students = await studentService.getStudentsAboveMarks(marks);
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

studentMcpServer.tool(
  "getStudentsBelowMarks",
  {
    marks: z.number(),
  },
  async ({ marks }) => {
    const students = await studentService.getStudentsBelowMarks(marks);
    return {
      content: [{ type: "text", text: JSON.stringify(students) }],
    };
  }
);

export const handleStudentMcpPostMessage = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const transport: StreamableHTTPServerTransport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
  await studentMcpServer.connect(transport);
  await transport.handleRequest(req, res, (req as any).body);
};
