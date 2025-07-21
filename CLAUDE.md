## Documentation and Branding Guidelines

### Branding and Professionalism
- NEVER EVER include Claude Code branding, self-promotion, or any "Generated with Claude" text in commit messages or anywhere in the codebase. Keep everything clean and professional.

### Review and Approval Tags

#### Critical Rules
- NEVER EVER ADD ANY @approved_by OR @reviewed_by TAGS UNDER ANY CIRCUMSTANCES, ONLY A HUMAN MAY DO THIS
- ALWAYS remove @approved_by OR @reviewed_by tags when editing a function, as it needs reviewing again

### Function Documentation Guidelines

#### JSDoc Requirements
- All functions must have JSDoc comments with at least a brief description
- All functions must have @approved_by: username tag to pass linting/build

#### Claude Behavior when Editing Functions
- MUST remove any existing @approved_by tag when modifying a function
- NEVER EVER add @approved_by tags - only humans can add these after review
- NEVER EVER add @reviewed_by tags - only humans can add these after review
- Leave functions without review tags so build fails until human reviews

### Human Workflow
- Review AI-modified functions that are missing @approved_by tags
- Add @approved_by: your_username after review is complete

### JSDoc Format Examples

#### Function Created/Edited by Claude:
```javascript
/**
 * Brief description of what the function does
 */
function myFunction() {}
```

#### Function After Human Review:
```javascript
/**
 * Brief description of what the function does
 * @approved_by: john.doe
 */
function myFunction() {}
```
