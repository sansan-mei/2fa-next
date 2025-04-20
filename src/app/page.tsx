import { AuthContent } from "@/components/AuthContent";
import { TimeProvider } from "@/store/TimeProvider";

export default async function Home() {
  return (
    <TimeProvider>
      <AuthContent />
    </TimeProvider>
  );
}
