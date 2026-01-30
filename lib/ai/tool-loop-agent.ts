import { generateText, streamText } from "ai"

type StopCondition = { type: "stepCount"; maxSteps: number }

type ToolLoopAgentConfig = {
  model: unknown
  system?: string
  tools?: Record<string, unknown>
  stopWhen?: StopCondition
}

type GenerateArgs = { prompt: string }

export function stepCountIs(maxSteps: number): StopCondition {
  return { type: "stepCount", maxSteps }
}

export class ToolLoopAgent {
  private readonly config: ToolLoopAgentConfig

  constructor(config: ToolLoopAgentConfig) {
    this.config = config
  }

  async generate({ prompt }: GenerateArgs) {
    const { model, system, tools, stopWhen } = this.config
    const maxSteps = stopWhen?.type === "stepCount" ? stopWhen.maxSteps : undefined
    return generateText({ model, system, prompt, tools, maxSteps })
  }

  async stream({ prompt }: GenerateArgs) {
    const { model, system, tools, stopWhen } = this.config
    const maxSteps = stopWhen?.type === "stepCount" ? stopWhen.maxSteps : undefined
    return streamText({ model, system, prompt, tools, maxSteps })
  }
}
