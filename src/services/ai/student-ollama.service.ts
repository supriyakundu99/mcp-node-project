import axios from "axios";
import { StudentService } from "../system/student.service";
import { createStudentToolCallPrompt, isStudentRelatedQuery } from "../../prompts/student-intent.prompt";

interface ToolCall {
  tool: string;
  parameters: any;
  reasoning?: string;
}

interface LLMResponse {
  needsMoreTools: boolean;
  toolCalls?: ToolCall[];
  finalResponse?: string;
}

export class StudentOllamaService {
  private baseUrl = "http://localhost:11434";
  private studentService = new StudentService();
  private maxIterations = 5;

  private createToolCallPrompt(prompt: string, previousData: any[] = []): string {
    return createStudentToolCallPrompt(prompt, previousData);
  }

  private async executeTool(toolCall: ToolCall): Promise<any> {
    console.log(`🔧 [StudentOllamaService] Executing tool: ${toolCall.tool}`, toolCall.parameters);

    try {
      switch (toolCall.tool) {
        case "getStudentById":
          return await this.studentService.getStudent(toolCall.parameters.id);
        
        case "searchStudentsByName":
          return await this.studentService.searchStudentsByName(toolCall.parameters.name);
        
        case "searchStudentsByDepartment":
          return await this.studentService.searchStudentsByDepartment(toolCall.parameters.department);
        
        case "searchStudentsByClass":
          return await this.studentService.searchStudentsByClass(toolCall.parameters.class_year);
        
        case "getStudentMarks":
          return await this.studentService.getStudentMarks(toolCall.parameters.student_id);
        
        case "getStudentsAboveMarks":
          return await this.studentService.getStudentsAboveMarks(toolCall.parameters.marks);
        
        case "getStudentsBelowMarks":
          return await this.studentService.getStudentsBelowMarks(toolCall.parameters.marks);
        
        case "getStudentStatistics":
          return await this.studentService.getStudentStatistics();
        
        case "searchStudentsByMarksRange":
          return await this.studentService.searchStudentsByMarksRange(
            toolCall.parameters.min, 
            toolCall.parameters.max
          );
        
        case "getTotalStudents":
          return await this.studentService.getTotalStudents();
        
        default:
          throw new Error(`Unknown tool: ${toolCall.tool}`);
      }
    } catch (error) {
      console.error(`❌ Tool execution failed: ${toolCall.tool}`, error);
      throw error;
    }
  }

  private async callLLM(prompt: string, model: string): Promise<LLMResponse> {
    try {
      console.log(`📤 [StudentOllamaService] Calling LLM with model: ${model}`);
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more consistent JSON responses
          top_p: 0.9,
        }
      });

      const responseText = response.data.response.trim();
      console.log(`📥 [StudentOllamaService] Raw LLM response:`, responseText);
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("❌ [StudentOllamaService] LLM call failed:", error);
      
      // Return a fallback response for non-student queries
      if (!isStudentRelatedQuery(prompt)) {
        return {
          needsMoreTools: false,
          finalResponse: "I'm a specialized student management assistant. I can only help with student-related queries such as:\n\n- Finding students by name, department, or class\n- Checking student marks and performance\n- Getting student statistics\n- Managing student records\n\nPlease ask me about student information instead!"
        };
      }
      
      return {
        needsMoreTools: false,
        finalResponse: "I encountered an error processing your student-related request. Please try rephrasing your question or contact support."
      };
    }
  }

  private validateToolCall(toolCall: ToolCall): boolean {
    const requiredParams: { [key: string]: string[] } = {
      "getStudentById": ["id"],
      "searchStudentsByName": ["name"],
      "searchStudentsByDepartment": ["department"],
      "searchStudentsByClass": ["class_year"],
      "getStudentMarks": ["student_id"],
      "getStudentsAboveMarks": ["marks"],
      "getStudentsBelowMarks": ["marks"],
      "searchStudentsByMarksRange": ["min", "max"],
      "getStudentStatistics": [],
      "getTotalStudents": []
    };

    const required = requiredParams[toolCall.tool];
    if (!required) {
      console.warn(`⚠️ Unknown tool: ${toolCall.tool}`);
      return false;
    }

    return required.every(param => toolCall.parameters && toolCall.parameters[param] !== undefined);
  }

  async generateResponse(prompt: string, model: string = "llama2") {
    console.log(`🚀 [StudentOllamaService] Starting multi-step response generation`);
    console.log(`📝 [StudentOllamaService] User prompt: ${prompt}`);
    console.log(`🤖 [StudentOllamaService] Using model: ${model}`);
    
    // Quick check for non-student queries
    if (!isStudentRelatedQuery(prompt)) {
      console.log(`⚠️ [StudentOllamaService] Non-student query detected, declining politely`);
      return {
        success: true,
        response: "I'm a specialized student management assistant. I can only help with student-related queries such as:\n\n## What I can help with:\n- **Finding students** by name, department, or class year\n- **Student marks** and academic performance\n- **Student statistics** and counts\n- **Managing student records**\n\nPlease ask me about student information instead!",
        model,
        iterations: 0,
        toolsUsed: 0,
        isStudentQuery: false
      };
    }
    
    let iteration = 0;
    let previousData: any[] = [];
    let currentPrompt = this.createToolCallPrompt(prompt);

    try {
      while (iteration < this.maxIterations) {
        iteration++;
        console.log(`🔄 [StudentOllamaService] Iteration ${iteration}/${this.maxIterations}`);

        const llmResponse = await this.callLLM(currentPrompt, model);

        // Check if we have a final response
        if (!llmResponse.needsMoreTools) {
          console.log(`✅ [StudentOllamaService] Final response generated after ${iteration} iterations`);
          return {
            success: true,
            response: llmResponse.finalResponse,
            model,
            iterations: iteration,
            toolsUsed: previousData.length,
            toolResults: previousData,
            isStudentQuery: true
          };
        }

        // Validate tool calls
        if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
          console.log(`⚠️ [StudentOllamaService] No valid tool calls provided`);
          break;
        }

        console.log(`🔧 [StudentOllamaService] Executing ${llmResponse.toolCalls.length} tool(s)`);

        // Execute all tool calls
        for (const toolCall of llmResponse.toolCalls) {
          if (!this.validateToolCall(toolCall)) {
            console.warn(`⚠️ Invalid tool call: ${toolCall.tool}`, toolCall.parameters);
            previousData.push({
              tool: toolCall.tool,
              parameters: toolCall.parameters,
              error: "Invalid parameters for tool call",
              reasoning: toolCall.reasoning
            });
            continue;
          }

          try {
            const toolResult = await this.executeTool(toolCall);
            console.log(`✅ Tool ${toolCall.tool} executed successfully`);
            
            previousData.push({
              tool: toolCall.tool,
              parameters: toolCall.parameters,
              result: toolResult,
              reasoning: toolCall.reasoning
            });
          } catch (error) {
            console.error(`❌ Tool execution failed: ${toolCall.tool}`, error);
            previousData.push({
              tool: toolCall.tool,
              parameters: toolCall.parameters,
              error: error instanceof Error ? error.message : "Unknown error",
              reasoning: toolCall.reasoning
            });
          }
        }

        // Update prompt with new data for next iteration
        currentPrompt = this.createToolCallPrompt(prompt, previousData);
      }

      // Max iterations reached
      console.warn(`⚠️ [StudentOllamaService] Maximum iterations (${this.maxIterations}) reached`);
      return {
        success: false,
        error: `Maximum iterations (${this.maxIterations}) reached without generating a final response. The system may need more iterations to complete this complex query.`,
        model,
        iterations: iteration,
        toolsUsed: previousData.length,
        toolResults: previousData,
        isStudentQuery: true
      };

    } catch (error) {
      console.error("❌ [StudentOllamaService] Error in generateResponse:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during processing",
        model,
        iterations: iteration,
        toolsUsed: previousData.length,
        isStudentQuery: true
      };
    }
  }

  // Utility method to get available tools
  getAvailableTools(): string[] {
    return [
      "getStudentById",
      "searchStudentsByName", 
      "searchStudentsByDepartment",
      "searchStudentsByClass",
      "getStudentMarks",
      "getStudentsAboveMarks",
      "getStudentsBelowMarks",
      "getStudentStatistics",
      "searchStudentsByMarksRange",
      "getTotalStudents"
    ];
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      console.error("❌ [StudentOllamaService] Health check failed:", error);
      return false;
    }
  }
}