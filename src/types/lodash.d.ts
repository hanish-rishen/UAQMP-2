declare module "lodash" {
  export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    }
  ): (...args: Parameters<T>) => ReturnType<T>;
}
