declare module "katex" {
  interface KatexOptions {
    displayMode?: boolean;
    output?: "html" | "mathml" | "htmlAndMathml";
    leqno?: boolean;
    fleqn?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string | ((errorCode: string, errorMsg: string, token: unknown) => boolean | string);
    trust?: boolean | ((context: unknown) => boolean);
  }

  const katex: {
    renderToString(tex: string, options?: KatexOptions): string;
  };

  export default katex;
}
