import { AuthContent } from "@/components/AuthContent";
import { TimeProvider } from "@/components/TimeProvider";
import { getData } from "@/utils/api";

export default async function Home() {
  const data = await getData();

  return (
    <TimeProvider>
      <AuthContent initialCodes={data} />
    </TimeProvider>
  );
}
