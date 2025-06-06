declare module 'jest-axe' {
  interface AxeResults {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  }

  export function axe(element: Element | Document, options?: any): Promise<AxeResults>;
  export function toHaveNoViolations(results: AxeResults): { pass: boolean; message: () => string };
  export function configureAxe(options?: any): typeof axe;
}