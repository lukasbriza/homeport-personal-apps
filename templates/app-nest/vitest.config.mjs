import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // A freshly scaffolded app has no tests yet — don't fail the pipeline.
    passWithNoTests: true,
    // ... Specify options here.
  },
})
