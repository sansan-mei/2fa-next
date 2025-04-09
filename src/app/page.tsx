import { AuthContent } from "@/components/AuthContent";
import { TimeProvider } from "@/components/TimeProvider";

export default async function Home() {
  return (
    <TimeProvider>
      <AuthContent />
    </TimeProvider>
  );
}
