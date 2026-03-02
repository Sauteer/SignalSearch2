import { SearchResult, OpenRouterMessage, SearchQuery } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are a research synthesis assistant for a Head of Product in AI/ML. Your task is to summarize search results with extreme density and precision.

## Rules for Synthesis

1. **Pattern Recognition**: Identify specific code libraries, CLI tools, model weights, or technical implementations mentioned. Always include version numbers or specific names when available.

2. **Architectural Mapping**: Extract system design decisions. For example: "Used Qdrant for vector storage because..." or "Implemented RAG with chunk size 512..."

3. **No Fluff Rule**: 
   - NEVER start with "In this video..." or "The author discusses..." or "This article covers..."
   - Start directly with the technical insight or finding
   - Avoid all filler phrases and marketing language

4. **Density Extraction**: For high-value sources like Simon Willison, The Zvi, or technical blogs:
   - Extract the exact technical claim or finding
   - Preserve the reasoning chain, not just conclusions
   - Note any counter-arguments or limitations mentioned

5. **Format**: Use Markdown with:
   - **Bold** for key terms, library names, or model names
   - Inline citations like [1], [2] referencing source indices
   - Bullet points for independent findings
   - Numbered lists for sequential reasoning or steps

6. **Prioritization**:
   - Technical novelty > general announcements
   - Architectural decisions > product features  
   - Recent developments > older content
   - Ignore SEO-laden "Ultimate Guide" or "Everything you need to know" content

7. **Source Context**: Each citation [N] should correspond to a specific source. If multiple sources say the same thing, cite all: [1][3][5].

## Output Format

### Key Technical Developments
- [Dense technical insight with citation]

### Notable Releases
- [Specific release/announcement with version/model details]

### Community Signals
- [What the community is discussing/debating]

### Architectural Insights
- [System design or implementation decisions noted]`;

export async function synthesizeWithOpenRouter(
  results: SearchResult[],
  query: string,
  apiKey: string,
  model: string = "anthropic/claude-3.5-sonnet"
): Promise<string> {
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  // Format results for the LLM
  const formattedResults = results
    .slice(0, 10)
    .map((result, index) => {
      const date = result.publishedAt
        ? new Date(result.publishedAt).toLocaleDateString()
        : "Unknown date";
      return `[${index + 1}] **${result.title}** (${result.source}, ${date})
${result.snippet}
${result.rawContent ? `Full content: ${result.rawContent.slice(0, 1500)}` : ""}
URL: ${result.url}`;
    })
    .join("\n\n---\n\n");

  const messages: OpenRouterMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Query: ${query}

Search Results:
${formattedResults}

Synthesize these results for a Head of Product. Focus on technical novelty, architectural decisions, and recency. Ignore SEO content. Use Markdown with inline citations.`,
    },
  ];

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SignalSearch",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No synthesis generated";
  } catch (error) {
    console.error("OpenRouter synthesis error:", error);
    throw error;
  }
}

// Streaming version for real-time updates
export async function* synthesizeWithOpenRouterStream(
  results: SearchResult[],
  query: string,
  apiKey: string,
  synthesisConfig?: NonNullable<SearchQuery["synthesisConfig"]>,
  model: string = "anthropic/claude-3.5-sonnet"
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  // Map user configs to prompt directives
  let personaDirective = "Head of Product in AI/ML";
  if (synthesisConfig?.persona === "eli5") personaDirective = "friendly teacher explaining to a smart 5-year old";
  if (synthesisConfig?.persona === "academic") personaDirective = "rigorous academic researcher prioritizing peer-reviewed evidence";

  let formatDirective = "summarize search results with extreme density and precision";
  if (synthesisConfig?.format === "brief") formatDirective = "provide an extremely brief, 3-bullet-point TL;DR. No fluff.";
  if (synthesisConfig?.format === "actionable") formatDirective = "extract only actionable takeaways and concrete next steps.";

  const dynamicSystemPrompt = `You are a research synthesis assistant for a ${personaDirective}. Your task is to ${formatDirective}.
${SYSTEM_PROMPT.replace(`You are a research synthesis assistant for a Head of Product in AI/ML. Your task is to summarize search results with extreme density and precision.`, "")}`;

  const formattedResults = results
    .slice(0, 10)
    .map((result, index) => {
      const date = result.publishedAt
        ? new Date(result.publishedAt).toLocaleDateString()
        : "Unknown date";
      return `[${index + 1}] **${result.title}** (${result.source}, ${date})
${result.snippet}
${result.rawContent ? `Full content: ${result.rawContent.slice(0, 1500)}` : ""}
URL: ${result.url}`;
    })
    .join("\n\n---\n\n");

  const messages: OpenRouterMessage[] = [
    { role: "system", content: dynamicSystemPrompt },
    {
      role: "user",
      content: `User's Primary Intention/Goal: ${query || "Provide a general synthesis."}

Search Results:
${formattedResults}

Synthesize these results fulfilling the user's intent. Focus on technical novelty, architectural decisions, and recency. Ignore SEO content. Use Markdown with inline citations.`,
    },
  ];

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SignalSearch",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error("OpenRouter streaming error:", error);
    throw error;
  }
}

// Generates an expanded keyword string using OR operators for Lexical APIs
export async function generateSynonyms(
  keywords: string,
  intention: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || !keywords) return keywords;

  const prompt = `You are a search query optimizer. The user wants to search for keywords: "${keywords}". 
Their overall intention is: "${intention || keywords}".
Generate 2 highly relevant synonym phrases or alternate terms that a professional would use for these keywords.
Return ONLY a single string consisting of the original keywords and your synonyms separated by the OR operator.
Do not include any other text, quotes, or conversational filler.
Example output: RAG PUBSUB OR ("retrieval augmented generation" AND "publish-subscribe") OR "vector search message queue"`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SignalSearch Synonyms",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Fast, cheap model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) return keywords;

    const data = await response.json();
    const expanded = data.choices[0]?.message?.content?.trim();

    // Fallback if LLM outputs something weird
    if (!expanded || expanded.length > 200 || expanded.includes("\n")) {
      return keywords;
    }

    return expanded;
  } catch (error) {
    console.error("Synonyms generation error:", error);
    return keywords;
  }
}