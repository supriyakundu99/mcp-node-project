import axios from "axios";

export class OllamaService {
  private baseUrl = "http://localhost:11434";

  async generateResponse(prompt: string, model: string = "llama2") {
    console.log(
      `Generating response for model: ${model} with prompt: ${prompt}`
    );
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
      });
      console.log("Ollama response:", response.data.response);
      return {
        success: true,
        response: response.data.response,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        model,
      };
    }
  }
}
