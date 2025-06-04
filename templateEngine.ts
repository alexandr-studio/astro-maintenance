export interface TemplateContext {
  [key: string]: any;
}

export interface TemplateToken {
  type: 'text' | 'variable' | 'if' | 'else' | 'endif';
  content: string;
  variable?: string;
  startPos: number;
  endPos: number;
}

export class HandlebarsCompatibleEngine {
  private static readonly VARIABLE_REGEX = /\{\{([^#\/}][^}]*)\}\}/g;
  private static readonly IF_REGEX = /\{\{#if\s+([^}]+)\}\}/g;
  private static readonly ELSE_REGEX = /\{\{else\}\}/g;
  private static readonly ENDIF_REGEX = /\{\{\/if\}\}/g;

  /**
   * Tokenize the template into processable chunks
   */
  private static tokenize(template: string): TemplateToken[] {
    const tokens: TemplateToken[] = [];
    const allMatches: Array<{ match: RegExpExecArray; type: string }> = [];

    // Find all Handlebars expressions
    let match;
    
    // Variables
    const varRegex = new RegExp(this.VARIABLE_REGEX.source, 'g');
    while ((match = varRegex.exec(template)) !== null) {
      allMatches.push({ match, type: 'variable' });
    }

    // If statements
    const ifRegex = new RegExp(this.IF_REGEX.source, 'g');
    while ((match = ifRegex.exec(template)) !== null) {
      allMatches.push({ match, type: 'if' });
    }

    // Else statements
    const elseRegex = new RegExp(this.ELSE_REGEX.source, 'g');
    while ((match = elseRegex.exec(template)) !== null) {
      allMatches.push({ match, type: 'else' });
    }

    // End if statements
    const endifRegex = new RegExp(this.ENDIF_REGEX.source, 'g');
    while ((match = endifRegex.exec(template)) !== null) {
      allMatches.push({ match, type: 'endif' });
    }

    // Sort by position
    allMatches.sort((a, b) => a.match.index! - b.match.index!);

    // Create tokens including text between expressions
    let lastIndex = 0;
    for (const { match, type } of allMatches) {
      const startPos = match.index!;
      const endPos = startPos + match[0].length;

      // Add text before this match
      if (startPos > lastIndex) {
        tokens.push({
          type: 'text',
          content: template.slice(lastIndex, startPos),
          startPos: lastIndex,
          endPos: startPos
        });
      }

      // Add the expression token
      tokens.push({
        type: type as any,
        content: match[0],
        variable: type === 'variable' || type === 'if' ? match[1]?.trim() : undefined,
        startPos,
        endPos
      });

      lastIndex = endPos;
    }

    // Add remaining text
    if (lastIndex < template.length) {
      tokens.push({
        type: 'text',
        content: template.slice(lastIndex),
        startPos: lastIndex,
        endPos: template.length
      });
    }

    return tokens;
  }

  /**
   * Get value from context, supporting nested properties
   */
  private static getValue(context: TemplateContext, path: string): any {
    if (!path) return undefined;
    
    path = path.trim();
    
    if (path.includes('.')) {
      const parts = path.split('.');
      let current = context;
      
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = current[part];
      }
      
      return current;
    }
    
    return context[path];
  }

  /**
   * Check if a value is truthy in Handlebars context
   */
  private static isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Process conditional blocks using a stack-based approach
   */
  private static processConditionals(tokens: TemplateToken[], context: TemplateContext): TemplateToken[] {
    const result: TemplateToken[] = [];
    const stack: Array<{ condition: boolean; tokens: TemplateToken[] }> = [];
    
    for (const token of tokens) {
      if (token.type === 'if') {
        const value = this.getValue(context, token.variable!);
        const condition = this.isTruthy(value);
        stack.push({ condition, tokens: [] });
      } else if (token.type === 'endif') {
        const frame = stack.pop();
        if (frame) {
          // Process the conditional block
          const processedTokens = this.processConditionalBlock(frame.tokens, frame.condition);
          
          if (stack.length > 0) {
            // We're still inside another conditional
            stack[stack.length - 1].tokens.push(...processedTokens);
          } else {
            // We're at the top level
            result.push(...processedTokens);
          }
        }
      } else {
        if (stack.length > 0) {
          // We're inside a conditional block
          stack[stack.length - 1].tokens.push(token);
        } else {
          // We're at the top level
          result.push(token);
        }
      }
    }

    return result;
  }

  /**
   * Process tokens within a conditional block based on the condition result
   */
  private static processConditionalBlock(tokens: TemplateToken[], condition: boolean): TemplateToken[] {
    // Find if there's an else token
    const elseIndex = tokens.findIndex(t => t.type === 'else');
    
    if (elseIndex === -1) {
      // Simple {{#if}}...{{/if}} - include all tokens if condition is true
      return condition ? tokens : [];
    }

    // {{#if}}...{{else}}...{{/if}} - split at {{else}} and choose the appropriate part
    const beforeElse = tokens.slice(0, elseIndex);
    const afterElse = tokens.slice(elseIndex + 1);

    // Return the appropriate tokens based on condition, excluding the else token itself
    return condition ? beforeElse : afterElse;
  }

  /**
   * Substitute variables in the processed tokens
   */
  private static substituteVariables(tokens: TemplateToken[], context: TemplateContext): string {
    let result = '';

    for (const token of tokens) {
      if (token.type === 'text') {
        result += token.content;
      } else if (token.type === 'variable') {
        const value = this.getValue(context, token.variable!);
        if (typeof value === 'string') {
          result += value;
        } else if (value !== null && value !== undefined) {
          result += String(value);
        }
        // If value is null/undefined, we output nothing (Handlebars behavior)
      }
      // Other token types (if, else, endif) should have been processed away
    }

    return result;
  }

  /**
   * Main render method
   */
  public static render(template: string, context: TemplateContext = {}): string {
    try {
      // Step 1: Tokenize the template
      const tokens = this.tokenize(template);

      // Step 2: Process conditionals
      const processedTokens = this.processConditionals(tokens, context);

      // Step 3: Substitute variables and generate final output
      const result = this.substituteVariables(processedTokens, context);

      return result;
    } catch (error) {
      console.error('Template rendering error:', error);
      // Return the original template as fallback
      return template;
    }
  }

  /**
   * Compile a template for repeated use (optimization for future use)
   */
  public static compile(template: string): (context: TemplateContext) => string {
    const tokens = this.tokenize(template);
    
    return (context: TemplateContext = {}) => {
      try {
        const processedTokens = this.processConditionals(tokens, context);
        return this.substituteVariables(processedTokens, context);
      } catch (error) {
        console.error('Template rendering error:', error);
        return template;
      }
    };
  }
}

// Export a simple render function for ease of use
export function renderTemplate(template: string, context: TemplateContext = {}): string {
  return HandlebarsCompatibleEngine.render(template, context);
}