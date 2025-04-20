import dynamic from "next/dynamic";
import { ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function _Lazy<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): ComponentType<React.ComponentProps<T>> {
  return dynamic(load, {
    ssr: false, // 跳过服务端渲染，避免Hydration不一致
    loading: () => (fallback ? <>{fallback}</> : null), // 服务端和客户端的占位
  });
}
