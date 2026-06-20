/* Adapts untyped external SDK clients via Proxy dispatch — see ADR-0004. The unsafe-* lint
   rules are scoped-off for this file in eslint.config.mjs. */

/**
 * Return a transparent Proxy of `root` in which only the method at `path` is replaced by
 * `wrap(original)`; every other property is forwarded to the real object untouched (so the
 * wrapped client keeps all its other methods and behavior).
 */
export function interceptMethod<T extends object>(
  root: T,
  path: readonly string[],
  wrap: (original: (...args: any[]) => any) => (...args: any[]) => any,
): T {
  const [head, ...tail] = path;
  return new Proxy(root, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop !== head) return value;
      if (tail.length === 0) {
        const original = typeof value === "function" ? value.bind(target) : value;
        return wrap(original);
      }
      if (value && (typeof value === "object" || typeof value === "function")) {
        return interceptMethod(value, tail, wrap);
      }
      return value;
    },
  });
}
