import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    </div>
  );
}
