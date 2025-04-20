import { ComponentType, lazy, LazyExoticComponent, Suspense } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function _Lazy<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): LazyExoticComponent<T> {
  const LazyComponent = lazy(load);
  const LazyComponentWrapper = (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
  Object.defineProperty(LazyComponentWrapper, "displayName", {
    value: `Lazy(${LazyComponent.name || "Component"})`,
  });
  return LazyComponentWrapper as LazyExoticComponent<T>;
}
