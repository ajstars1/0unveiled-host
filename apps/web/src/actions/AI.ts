'use server';

import { db } from "@/lib/drizzle";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ShowcasedItemWithSkills } from "./portfolioActions";
import { sql } from "drizzle-orm";

//INITIALIZE CLIENTS
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: {
    responseMimeType: "application/json",
  }
});


// TYPE DEFINITIONS FOR INSIGHTS
export interface ProjectEvaluation {
  projectTitle: string;
  positiveFeedback: string[];      // a list of things the user did well
  areasForImprovement: string[];   // a list of areas that could be improved
  actionableSuggestions: string[]; // specific, concrete steps the user can take
}
export interface AIBatchEvaluationResponse {
  projectEvaluations: ProjectEvaluation[];
  overallPortfolioAnalysis: string; // a holistic summary and strategic advice
}
interface UserContext {
  bio: string | null;
  headline: string | null;
}

export interface ProjectInputDataForAI {
  projectTitle: string;
  userRole: string | null;
  userContributions: string | null;
  userListedSkills: string[];
  projectDescription?: string | null;
  analysisType: 'TEXT' | 'CODE'; // tell the AI which analysis to run
  code?: string; // combined source code for code analysis
}

// RAG HELPER FUNCTION
async function findRelevantContext(projectEmbedding: number[]): Promise<string> {
  try {
    const results = await db.execute(sql`
      SELECT content FROM "KnowledgeArticle"
      ORDER BY embedding <=> ${projectEmbedding}::vector
      LIMIT 3
    `);
    if (results.length === 0) return "No specific context found.";
    return results.map((r: any) => r.content).join("\n\n---\n\n");
  } catch (error) {
    console.error("Error during vector search:", error);
    return "Could not retrieve context due to an error.";
  }
}


// MAIN AI FUNCTION
async function evaluateMultipleProjectsWithAI(
  projectsToEvaluate: ProjectInputDataForAI[],
  userContext: UserContext
): Promise<AIBatchEvaluationResponse | { error: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "AI service is not configured." };
  }

  const projectsWithContext = await Promise.all(
    projectsToEvaluate.map(async (project) => {
      // the RAG context is fetched based on the project description in both cases
      const inputText = `${project.projectTitle}: ${project.userContributions || project.projectDescription}`;
      const embeddingResult = await embeddingModel.embedContent(inputText);
      const projectEmbedding = embeddingResult.embedding.values;
      const relevantContext = await findRelevantContext(projectEmbedding);
      return { ...project, context: relevantContext };
    })
  );

  // the prompt construction depends on the analysis type
  const projectsListString = projectsWithContext.map(p => {
    //what we send to the AI
    const analysisContent = p.analysisType === 'CODE'
      ? `"projectCode": """\n${p.code}\n"""`
      : `"userContributions": "${p.userContributions || 'Not specified'}"`;

    return `
      {
        "projectTitle": "${p.projectTitle}",
        "analysisType": "${p.analysisType}",
        ${analysisContent},
        "expertContext": """
        ${p.context}
        """
      }
    `;
  }).join(',\n');

  const prompt = `
    You are an expert career coach and senior software engineer. Your task is to provide detailed feedback on a user's portfolio projects.
    For each project, you will be given an "analysisType". 
    - If analysisType is 'TEXT', analyze the user's description of their contributions.
    - If analysisType is 'CODE', perform a high-level code review of the provided source code.
    
    In both cases, you MUST use the provided "expertContext" from a knowledge base as your primary guide.

    CRITICAL INSTRUCTION: Respond with a single, valid JSON object that strictly adheres to the AIBatchEvaluationResponse interface. Do not include any text before or after the JSON.

    AIBatchEvaluationResponse Interface:
    {
      "projectEvaluations": [
        {
          "projectTitle": "string",
          "positiveFeedback": ["string (For CODE, mention good patterns. For TEXT, mention good project choices.)"],
          "areasForImprovement": ["string (For CODE, suggest refactoring. For TEXT, suggest better documentation.)"],
          "actionableSuggestions": ["string (Concrete next steps like 'Add unit tests to X file' or 'Create a live demo.')"]
        }
      ],
      "overallPortfolioAnalysis": "string (Holistic summary based on all projects analyzed.)"
    }

    User Context:
    - User Bio: "${userContext.bio || 'Not provided'}"
    - User Headline: "${userContext.headline || 'Not provided'}"

    Projects Array to Evaluate:
    [${projectsListString}]

    IMPORTANT: After evaluating all projects, ensure the 'overallPortfolioAnalysis' field contains a holistic summary. This field MUST NOT be empty.

    Your JSON response:
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    const responseText = result.response.text();
    
    console.log("--- RAW AI CODE ANALYSIS RESPONSE ---");
    console.log(responseText);
    console.log("-----------------------------------");
    
    if (!responseText) throw new Error("AI returned an empty response.");

    const evaluation = JSON.parse(responseText) as AIBatchEvaluationResponse;
    if (!evaluation || !Array.isArray(evaluation.projectEvaluations)) {
      throw new Error("AI returned an invalid structure.");
    }
    
    return evaluation;
  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    return { error: `An error occurred during AI analysis. Please check the server logs.` };
  }
}

// INSIGHTS FUNCTION

export async function getAiBenchmarkInsights(
  // function accepts the fully prepared input data
  projectsInputForAI: ProjectInputDataForAI[],
  userContext: UserContext
): Promise<AIBatchEvaluationResponse | { error: string }> {
  
  if (!projectsInputForAI || projectsInputForAI.length === 0) {
    return { error: "No project data provided for analysis." };
  }
  // console.log("Received projects for AI evaluation:", projectsInputForAI);
  // Validate that each project has the required fields
  // console.log("Context for AI evaluation:", userContext);

  // the main job of this function is now simply to pass the prepared data
  // to the internal evaluation function
  const evaluationResult = await evaluateMultipleProjectsWithAI(
    projectsInputForAI,
    userContext
  );

  return evaluationResult;
}
