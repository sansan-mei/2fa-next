import { AuthContent } from "@/components/AuthContent";
import { TimeProvider } from "@/store/TimeProvider";

export default async function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <TimeProvider>
        <AuthContent />
      </TimeProvider>
    </div>
  );
}
