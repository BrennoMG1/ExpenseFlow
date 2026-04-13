---
name: rpa-workflow-architect
description: Comprehensive workflow for generating and editing RPA workflows (XAML files) in UiPath Studio Desktop. Use this when users need to create new RPA automations, modify existing workflows, fix XAML errors, or iterate on workflow implementations. Supports discovery-first approach with error-driven refinement.
icon: FaRobot
color: "#FA4616"
---

# RPA Workflow Architect

Generate and edit RPA workflows using a **discovery-first approach** with **iterative error-driven refinement**. Always understand before acting, start simple, and validate continuously.

## Core Principles

1. **Discovery Before Generation** - Never generate XAML without first understanding project structure and existing patterns
2. **Search Examples Repository** - Always use `RpaWorkflowExamplesListTool` to find relevant examples, then `RpaWorkflowExamplesGetTool` to retrieve and study them
3. **Start Simple, Iterate** - Create minimal working version first, then refine through validation cycles
4. **Validate After Every Change** - Never assume success; always check with GetErrorsTool
5. **Fix Errors Methodically** - Categorize errors and fix in order: Package → Structure → Type → Logic

---

## Tool Quick Reference

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| **GetProjectStructureTool** | Explore project files and folder layout | `projectId` |
| **FileSearchTool** | Find files by regex pattern | `regexQuery`, `rootDirectory`, `maxResults` |
| **RpaWorkflowGrepTool** | Search XAML content for patterns | `workflowFilePath`, `regexQuery`, `matchWindowRadius` |
| **ReadFileTool** | Read file contents with line numbers | `filePath`, `offset`, `limit` |
| **GetProjectContextTool** | Get parsed workflow structure (variables, arguments, outline) | `workflowFilePath`, `queryType` (`full`, `projectDefinition`, `entities`, `designerState`, `objects`) |
| **RpaActivitySearchTool** | Search for activities globally by query and optional tags | `query`, `tags` (optional), `limit` (optional, default 10) |
| **RpaActivityDefaultTool** | Get default XAML template for an activity | `activityClassName` (required for non-dynamic), `activityTypeId` (required for dynamic, found using RpaActivitySearchTool), `isDynamicActivity` (boolean from RpaActivitySearchTool), `connectionId` (optional, for dynamic activities, obtained via GetProjectContextTool with queryType: `full`) |
| **RpaWorkflowCreateTool** | Create new workflow file | `workflowFilePath`, `xamlContent`, `fileType` |
| **RpaWorkflowEditTool** | Edit existing workflow via string replacement | `workflowFilePath`, `oldXamlContent`, `newXamlContent` |
| **GetErrorsTool** | Check for compilation errors | `onlyCurrentFile` |
| **GetTypeDefinitionsTool** | Get type info at specific location | `filePath`, `searchStructure` (array with line, columnStart, columnEnd) |
| **InstallOrUpdatePackagesTool** | Add/update NuGet dependencies | `packages` (array of name/version objects) |
| **GetPackageVersionsTool** | Find available package versions | `packageId`, `includePrerelease` |
| **RunWorkflowTool** | Execute workflow for testing | `filePath` |
| **RpaWorkflowExamplesListTool** | Search example workflows by service tags | `tags` (array of service names), `prefix` (optional), `limit` (optional, default 10) |
| **RpaWorkflowExamplesGetTool** | Retrieve XAML content of a specific example | `key` (blob path from RpaWorkflowExamplesListTool results) |

---

## Supporting References

For detailed information, consult these files (read them on-demand):
- **[basics-and-rules.md](./references/basics-and-rules.md)** — XAML file anatomy, workflow types, safety rules, common editing operations, reference examples, and ConnectorActivity internals. **CRITICAL: read before generating/creating/editing any XAML.**
- **[control-flow-activities.md](./references/control-flow-activities.md)** — Core control flow activities with syntax and examples (Assign, If/Else, For Each, While, Try Catch, etc.)
- **[common-pitfalls.md](./references/common-pitfalls.md)** — Common pitfalls, constraints, scope requirements, property conflicts, gotchas, and issues that should be known before working with RPA workflows, along with strategies to avoid them
- **[productivity-suite-activities.md](./references/productivity-suite-activities.md)** — Microsoft and Google (O365, Gmail, GDrive, SharePoint) productivity-suite activity patterns and connection configuration examples
- **[project-structure.md](./references/project-structure.md)** — Project directory layout, project.json schema, common packages
- **[jit-custom-types-schema.md](./references/jit-custom-types-schema.md)** - How to get JIT custom types of dynamic activities.
- **[ui-automation.md](./references/ui-automation.md)** — UI Automation (UIA) best practices, rules, and XAML examples. **CRITICAL: read before generating/editing any UI Automation workflows**

---

## Core Workflow: Classify Request

**Determine CREATE or EDIT before proceeding:**

| Request Type | Trigger Words | Action |
|--------------|---------------|--------|
| **CREATE** | "generate", "create", "make", "build", "new" | Start with Discovery → Generate |
| **EDIT** | "update", "change", "fix", "modify", "add to" | Start with Discovery → Edit |

If unclear which file to edit, **ask the user** rather than guessing.

---

## Phase 1: Discovery

**Goal:** Understand project context and existing patterns before writing any XAML.

### Step 1.1: Project Structure

```
GetProjectStructureTool → projectId from context
GetProjectContextTool → queryType: "full" for detailed project structure
```
Analyze:
- Where should new workflows be placed? (folder conventions)
- What naming pattern is used? (match existing file names)
- What similar workflows already exist?
- Should I use VB or C# syntax? (check existing workflows and imports for Microsoft.VisualBasic)
- What packages are already installed? (check namespaces in existing XAML files)
- Are there existing connections, credentials, or objects I can reuse?

### Step 1.2: Find Examples

Search **both** the examples repository and the current project. This step is critical for understanding activity patterns, proper XAML structure, and activity properties.

#### A. Search Current Project
```
FileSearchTool:
  regexQuery: <pattern matching user intent>
  rootDirectory: "." (current project)
  maxResults: 15

RpaWorkflowGrepTool:
  workflowFilePath: <local example workflow>
  regexQuery: <activity or pattern>
  matchWindowRadius: 10

ReadFileTool:
  filePath: <local example workflow>
```

#### B. Search Examples Repository

Use `RpaWorkflowExamplesListTool` to discover relevant example workflows by service/integration tags:

```
RpaWorkflowExamplesListTool:
  tags: ["<service1>", "<service2>"]   # Use lowercase service names. Services are inferred from the user's prompt (e.g., 'outlook', 'google-drive', 'gmail', 'confluence' etc.)
  limit: 10                            # Adjust based on how many examples you want

RpaWorkflowExamplesGetTool:
  key: "<key from list results>"       # E.g., "email-communication/add-new-gmail-emails-to-keap-as-contacts.xaml"
```

**Tag Selection Guidelines:**
- Identify the services/integrations the user wants (e.g., "salesforce", "gmail", "jira")
- Convert to lowercase tags: `["salesforce"]`, `["gmail"]`, `["jira", "confluence"]`
- Multiple tags use AND logic - all tags must match
- Common tags: `confluence`, `jira`, `salesforce`, `outlook`, `gmail`, `slack`, `excel`, `sharepoint`, `teams`, `dropbox`, `hubspot`, `zendesk`, `servicenow`

**Examples:**
```
# User wants to automate Salesforce lead creation
RpaWorkflowExamplesListTool:
  tags: ["salesforce"]
  limit: 10

# User wants to sync Jira with Confluence
RpaWorkflowExamplesListTool:
  tags: ["jira", "confluence"]
  limit: 10

# User wants email automation with Gmail
RpaWorkflowExamplesListTool:
  tags: ["gmail"]
  limit: 15

# Once you identify relevant examples from the list, use multiple `RpaWorkflowExamplesGetTool` calls to retrieve the actual XAML content:
RpaWorkflowExamplesGetTool:
  key: "<key from list results>"   # e.g., "email-communication/add-new-gmail-emails-to-keap-as-contacts.xaml"
```

**Best Practices:**
- Retrieve 3-5 most relevant examples based on filename/tags matching user intent
- Study the XAML structure, activity configuration, and patterns
- Note the namespaces and packages used in the examples
- Extract reusable patterns for error handling, data transformation, etc.

### Step 1.3: Study Patterns

After retrieving example XAML content, analyze the XAML thoroughly.
**See the "Supporting References" section above. Read the relevant [reference files](./references/) before studying the examples to make sense of the structure and patterns.**

**Extract from ALL examples (both repository and local):**
- How are activities structured and configured?
- What properties are commonly set?
- What error handling patterns are used (Try-Catch, Retry scopes)?
- What packages/namespaces are referenced in the XAML header?
- What variable types and scopes are used?
- Are objects and connections from the project used?
- How are credentials and authentication handled?
- What output/result handling patterns exist?

**When studying repository examples from RpaWorkflowExamplesGetTool:**
- The tool returns the full XAML content directly
- Parse the namespace declarations at the top to identify required packages
- Look for `<Variable>` elements to understand data structures
- Study `<Argument>` elements for input/output patterns
- Study `<Configuration>` and `<Connection>` sections for determining dynamic activity properties usage
- Examine activity configurations for proper property settings

### Step 1.4: Discover Activities (When Needed)

Use `RpaActivitySearchTool` when the user describes an action and you need to find which activity implements it, or when you need the exact fully qualified class name, type ID, and `isDynamicActivity` flag before using `RpaActivityDefaultTool`.

```
RpaActivitySearchTool:
  query: "send mail"
  tags: ""            # Optional: narrow down results with tags
  limit: 10           # Optional: max results (default 10)
```

**When to use this tool:**
- You need to find the correct activities to use in a workflow, searching as you would do in a global search engine for activities
- You need activity details: fully qualified class name, type ID, description, configuration, whether it's dynamic, whether it's a trigger
- You need to explore available, useful activities before generating or editing workflows
- The user describes an action (e.g., "get weather") and you need to discover which activity implements it
- Before using `RpaActivityDefaultTool`, to find the exact FQDN class name, type ID, and `isDynamicActivity` flag
- You want to discover new activities not necessarily installed in the project (results are global, not limited to installed packages)

**How search works:**
- Works similarly to Studio's activity search bar
- Returns **global** results — not limited to packages currently installed in the project
- If a useful activity is found that isn't installed, use `InstallOrUpdatePackagesTool` to add it
- Tags can be used alongside the query to narrow down results further

**Examples:**
```
# Find activities for sending email
RpaActivitySearchTool:
  query: "send mail"
  limit: 5

# Find weather-related activities
RpaActivitySearchTool:
  query: "get weather"

# Find Excel read activities
RpaActivitySearchTool:
  query: "read range"
  limit: 10
```

**Do NOT use when:**
- You already know the exact activity to use and its exact fully qualified class name and/or type ID and can directly use `RpaActivityDefaultTool`

### Step 1.5: Resolve Activity Properties

When you need to insert or edit a specific activity, use `RpaActivityDefaultTool` to retrieve the activity's default XAML template, its properties, and the default values. Use it as a starting point for configuring new activities. This default representation is a crucial starting point as it ensures that Studio can properly render and parse the activity.

The tool handles both non-dynamic and dynamic activities via the `isDynamicActivity` parameter (obtained from `RpaActivitySearchTool` results).

#### For Non-Dynamic Activities (`isDynamicActivity` is false)

```
RpaActivityDefaultTool:
  activityClassName: "UiPath.Core.Activities.WriteLine"
  isDynamicActivity: false
```

#### For Dynamic Activities (`isDynamicActivity` is true)

```
RpaActivityDefaultTool:
  activityTypeId: "178a864d-90fd-43d3-a305-249b07ac0127"
  isDynamicActivity: true
  connectionId: ""
```

**When to use this tool:**
- You know which activity to use but need its exact XAML structure
- You need to verify the correct property names and default values
- You want a clean starting template without inherited configurations from examples

**Key parameters:**
- `isDynamicActivity`: Set based on the `isDynamicActivity` field from `RpaActivitySearchTool` results
- `activityClassName`: Required when `isDynamicActivity` is false. Must be fully qualified (e.g., `UiPath.Core.Activities.WriteLine`)
- `activityTypeId`: Required when `isDynamicActivity` is true. Use `RpaActivitySearchTool` to find the exact type ID
- `connectionId`: Optional, only used when `isDynamicActivity` is true. Use `GetProjectContextTool` with `queryType: "full"` to discover available connections

**Do NOT use when:**
- You already have the correct, error-free activity XAML
- You're unsure which activity to use (use `RpaActivitySearchTool` first)
- You need to understand what activities are available (use `RpaActivitySearchTool` first)

```
ReadFileTool:
  filePath: .project/JitCustomTypesSchema.json
```

For more details, see **[jit-custom-types-schema.md](./references/jit-custom-types-schema.md)**

### Step 1.6: Get Current Context

Before generating, understand reusable elements:

```
GetProjectContextTool:
  queryType: "full"
```

This provides:
- Existing variables and their types/scopes
- Current arguments and their directions (In/Out/InOut)
- Activity hierarchy and flow structure
- Available imports and namespaces
- Whether the project is C# or VB. In case of VB, you should notice `Microsoft.VisualBasic` as part of the imports
- Available assets, connections, queues, credentials, and other project-level or global-level resources

---

## Phase 2: Generate or Edit

### IMPORTANT Guidelines for both CREATE and EDIT:
- Always start with a minimal working version (e.g., default activity representation), then iterate based on errors and validation
- **CRITICAL:** Always read the relevant [reference files](./references/) for proper structure, syntax, rules, and patterns before generating or editing any XAML content. These references contain crucial information that prevents common mistakes and ensures the generated/edited workflows are correct and functional.
- Before generating ANY XAML, ensure you have studied relevant examples and understand the required structure and properties

### For CREATE Requests

**Strategy:** Generate minimal working version, expect to iterate.

```
RpaWorkflowCreateTool:
  workflowFilePath: <inferred from project structure>
  fileType: Sequence | Flowchart | StateMachine
  xamlContent: <simple initial implementation>
```

**File path inference:**
- Use folder conventions from GetProjectStructureTool
- Create descriptive filename: `Workflows/[Category]/[DescriptiveName].xaml`
- Ensure filename ends with `.xaml`

### For EDIT Requests

**Strategy:** Always read current content before editing.

```
ReadFileTool:
  filePath: <workflow to edit>

# OR for targeted search:
RpaWorkflowGrepTool:
  workflowFilePath: <workflow>
  regexQuery: <section to modify>
```

Then apply changes:

```
RpaWorkflowEditTool:
  workflowFilePath: <workflow>
  oldXamlContent: <exact text from file>
  newXamlContent: <modified text>
```

**Critical:** `oldXamlContent` must match exactly and be unique in the file. Include surrounding context if needed.

---

## Phase 3: Validate & Fix Loop

- This phase repeats until we obtain a 0-error state or errors cannot be resolved automatically.
- It is acceptable to defer some remaining configuration to the user. Just inform the user about any required manual updates they need to make after generation.
- If the required activity connection does not exist, reuse any available connection in the project as a placeholder
- If certain activity properties or arguments are unknown, provide default values (e.g., placeholders, default type values, or use `RpaActivityDefaultTool`)

### Step 3.1: Check for Errors

```
GetErrorsTool:
  onlyCurrentFile: true
  revalidate: true (if changes were made to the file)
```

### Step 3.2: Categorize and Fix

| Error Category | Indicators | Fix Strategy |
|----------------|------------|--------------|
| **Package Errors** | Missing namespace, unknown activity type | GetPackageVersionsTool → InstallOrUpdatePackagesTool |
| **Structural Errors** | Invalid XML, missing required properties | ReadFileTool → RpaWorkflowEditTool |
| **Type Errors** | Incorrect property type, invalid value | GetTypeDefinitionsTool → RpaWorkflowEditTool |
| **Activity Properties Errors** | Unknown dynamic properties, misconfigured activity | RpaActivitySearchTool → RpaActivityDefaultTool → RpaWorkflowEditTool |
| **Logic Errors** | Business logic issues, wrong behavior | ReadFileTool → RpaWorkflowEditTool |

**Fix order:** Package → Structure → Type → Dynamic Activity → Logic

### Step 3.3: Package Error Resolution

```
GetPackageVersionsTool:
  packageId: <from error>
  includePrerelease: false

# Select latest stable version, then:
InstallOrUpdatePackagesTool:
  packages: [{ name: "...", version: "..." }]
```

### Step 3.4: Resolving Dynamic Activity Custom Types

Dynamic activities (e.g., Integration Service connectors) retrieved via `RpaActivityDefaultTool` (with `isDynamicActivity: true`) may use **JIT-compiled custom types** for their input/output properties. After the activity is added to the workflow, when you need to discover the property names and CLR types of these custom entities (e.g., to populate an `Assign` activity targeting a custom type property, or to create a variable of a custom type), read the JIT custom types schema:


### Step 3.5: Iteration Loop

```
REPEAT:
  1. GetErrorsTool
  2. IF 0 errors (or errors cannot be resolved automatically) → EXIT to Phase 4
  3. Identify highest-priority error category
  4. Apply appropriate fix
  5. GOTO 1

DO NOT stop until all activities are resolved (recognized).
DO NOT skip validation steps.
DO NOT assume edits worked without checking.
```

Expect multiple iteration cycles for complex workflows.

---

## Phase 4: Response

**Provide comprehensive summary:**

1. **File path** of created/edited workflow (clickable reference)
2. **Brief description** of what the workflow does
3. **Key activities** and logic implemented
4. **Packages installed** (if any)
5. **Limitations** or notes for the user
6. **Suggested next steps** (testing, parameterization, etc.)
7. **Encourage user to review and customize further as needed** (e.g., fill in placeholders, set up connections etc.)

**Do NOT just say "workflow created"** - give user confidence the request was fully fulfilled.

---

## Anti-Patterns

**Never:**
- Generate XAML without first checking project structure and examples
- Assume a create/edit succeeded without validating with `GetErrorsTool`
- Stop iteration loop before reaching 0 errors
- Guess file paths without using `GetProjectStructureTool`
- Edit or create XAML without reading the appropriate [reference files](./references/) for proper structure, syntax, rules, and patterns
- Use generic `oldXamlContent` that matches multiple locations
- Tell RpaWorkflowCreateTool to generate .js files (it creates XAML only)
- Skip searching the examples repository with `RpaWorkflowExamplesListTool`
- Retrieve example content without first listing available examples
- Use incorrect/guessed keys with `RpaWorkflowExamplesGetTool` (always use keys from list results)
- Guess activity class names or type IDs (use `RpaActivitySearchTool` to find the exact type ID and FQDN class name first)
- Skip `RpaActivitySearchTool` when unsure which activity implements a user-described action
- Guess dynamic activity property names or types without using `RpaActivityDefaultTool` with `isDynamicActivity: true`

---

## Quality Checklist

Before handover, verify:

**Discovery & Examples:**
- [ ] Examples repository was searched with `RpaWorkflowExamplesListTool` for relevant patterns
- [ ] Relevant examples were retrieved and studied with `RpaWorkflowExamplesGetTool`
- [ ] Activities were discovered with `RpaActivitySearchTool`
- [ ] Started with a safe default XAML structure using `RpaActivityDefaultTool` (with correct `isDynamicActivity` flag)
- [ ] Activity properties were resolved with `RpaActivityDefaultTool` (for dynamic activities custom types, see the "Resolving Dynamic Activity Custom Types" section)

**XAML Content Quality:**
- [ ] VB.NET or C# syntax matches project language (checked existing workflows)
- [ ] All namespace declarations present for activities used (`xmlns:ui=...` etc.)
- [ ] Variables and arguments properly scoped and named

**Validation & Testing:**
- [ ] Workflow file path is valid and follows project conventions
- [ ] All required activities are present
- [ ] Error handling (Try-Catch) is included where appropriate

**User Communication:**
- [ ] User has been informed of any limitations
- [ ] Next steps have been suggested (testing, customization)
- [ ] Informed the user about any manual edits needed after generation (e.g., configuring connections, updating placeholders etc.)