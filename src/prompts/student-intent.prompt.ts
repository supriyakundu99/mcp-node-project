export function createStudentToolCallPrompt(userPrompt: string, previousData: any[] = []): string {
  const availableTools = `
AVAILABLE TOOLS:
1. getStudentById(id: number) - Get a specific student by ID
2. searchStudentsByName(name: string) - Search students by name (partial matching)
3. searchStudentsByDepartment(department: string) - Get all students in a department
4. searchStudentsByClass(class_year: number) - Get all students in a specific class year
5. getStudentMarks(student_id: number) - Get marks for a specific student
6. getStudentsAboveMarks(marks: number) - Get students with marks above threshold
7. getStudentsBelowMarks(marks: number) - Get students with marks below threshold
8. getStudentStatistics() - Get overall statistics (counts by department, class, etc.)
9. searchStudentsByMarksRange(min: number, max: number) - Get students with marks in a range
10. getTotalStudents() - Get total number of students
`;

  const previousDataSection = previousData.length > 0 
    ? `
PREVIOUS TOOL RESULTS:
${previousData.map((data, index) => `
${index + 1}. Tool: ${data.tool}
   Parameters: ${JSON.stringify(data.parameters)}
   ${data.error ? `Error: ${data.error}` : `Result: ${JSON.stringify(data.result, null, 2)}`}
   ${data.reasoning ? `Reasoning: ${data.reasoning}` : ''}
`).join('\n')}
` 
    : '';

  const systemPrompt = `You are an intelligent student management assistant. You MUST respond with valid JSON only.

CRITICAL: Your response must be ONLY valid JSON, no other text before or after!

${availableTools}

USER QUERY: "${userPrompt}"

${previousDataSection}

ANALYSIS RULES:
- For student name queries (e.g., "Show me John's performance"): Use searchStudentsByName first
- For department queries: Use searchStudentsByDepartment  
- For marks/performance queries: After finding student, use getStudentMarks
- For statistics: Use getStudentStatistics
- For non-student queries: Return needsMoreTools: false with polite decline

EXAMPLES:

Query: "Show me Vivek's performance"
{
  "needsMoreTools": true,
  "toolCalls": [
    {
      "tool": "searchStudentsByName",
      "parameters": {"name": "Vivek"},
      "reasoning": "First find student named Vivek to get their performance data"
    }
  ]
}

Query: "Show me students in Computer Science"  
{
  "needsMoreTools": true,
  "toolCalls": [
    {
      "tool": "searchStudentsByDepartment",
      "parameters": {"department": "Computer Science"},
      "reasoning": "Get all students in Computer Science department"
    }
  ]
}

Query: "Write code in C"
{
  "needsMoreTools": false,
  "finalResponse": "I'm a specialized student management assistant. I can only help with student-related queries such as finding students, checking marks, and managing academic records."
}

REQUIRED JSON FORMAT:
{
  "needsMoreTools": boolean,
  "toolCalls": [
    {
      "tool": "toolName",
      "parameters": {...},
      "reasoning": "explanation"
    }
  ],
  "finalResponse": "response if needsMoreTools is false"
}

RESPOND WITH VALID JSON ONLY:`;

  return systemPrompt;
}

// Additional helper function for common student queries
export function isStudentRelatedQuery(query: string): boolean {
  const studentKeywords = [
    'student', 'students', 'marks', 'grades', 'department', 'class',
    'semester', 'roll', 'name', 'email', 'statistics', 'count',
    'above', 'below', 'performance', 'academic', 'score', 'year'
  ];
  
  const lowerQuery = query.toLowerCase();
  return studentKeywords.some(keyword => lowerQuery.includes(keyword));
}