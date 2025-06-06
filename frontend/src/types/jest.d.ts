import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeDisabled(): R;
      toHaveFocus(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeRequired(): R;
      toHaveValue(value: string | number): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toHaveErrorMessage(message?: string | RegExp): R;
      toHaveNoViolations(): R;
    }

    interface MockedFunction<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>;
      mockClear(): void;
      mockImplementation(fn: T): MockedFunction<T>;
      mockReturnValue(value: ReturnType<T>): MockedFunction<T>;
      mockRestore(): void;
    }

    function fn<T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T>;
    function spyOn<T, K extends keyof T>(object: T, method: K): MockedFunction<T[K] extends (...args: any[]) => any ? T[K] : never>;
    function clearAllMocks(): void;
  }

  var beforeAll: (fn: () => void | Promise<void>) => void;
  var afterAll: (fn: () => void | Promise<void>) => void;
  var beforeEach: (fn: () => void | Promise<void>) => void;
  var afterEach: (fn: () => void | Promise<void>) => void;
  var describe: (name: string, fn: () => void) => void;
  var test: (name: string, fn: () => void | Promise<void>) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: jest.Expect;

  interface Window {
    ethereum?: {
      request: jest.MockedFunction<any>;
      on: jest.MockedFunction<any>;
      removeListener: jest.MockedFunction<any>;
      isMetaMask: boolean;
      chainId?: string;
      selectedAddress?: string | null;
    };
  }
}