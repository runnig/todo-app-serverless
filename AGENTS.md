## Makefile

Make sure to use "make lint", "make test-unit" and other make targets to verify your last edits.

## Optimize command line tool usage

CRITICAL: Pipe every non-interactive shell command through `distill` unless raw output is explicitly required.

CRITICAL: Your prompt to `distill` must be fully explicit. State exactly what you want to know and exactly what the output must contain. If you want only filenames, say `Return only the filenames.` If you want JSON, say `Return valid JSON only.` Do not ask vague questions.

Bad:
- `distill "Which files are shown?"`

Good:
- `distill "Which files are shown? Return only the filenames."`

Examples:
- `bun test 2>&1 | distill "Did the tests pass? Return only: PASS or FAIL, followed by failing test names if any."`
- `git diff 2>&1 | distill "What changed? Return only the files changed and a one-line summary for each file."`
- `terraform plan 2>&1 | distill "Is this safe? Return only: SAFE, REVIEW, or UNSAFE, followed by the exact risky changes."`
- `npm audit 2>&1 | distill "Extract the vulnerabilities. Return valid JSON only."`
- `rg -n "TODO|FIXME" . 2>&1 | distill "List files containing TODO or FIXME. Return only file paths, one per line."`
- `ls -la 2>&1 | distill "Which files are shown? Return only the filenames."`

You may skip `distill` only in these cases:
- Exact uncompressed output is required.
- Using `distill` would break an interactive or TUI workflow.

CRITICAL: Wait for `distill` to finish before continuing.

## Small LLM

Whenever possible or useful, use the small LLM (4 Billion parameters) available for you through the
command line `llm -m lmstudio/qwen3.5-4b "some query"`. This will help to speed up tasks and
save tokens

## Next.js

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
