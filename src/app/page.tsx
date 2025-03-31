import { AuthContent } from "@/components/AuthContent";
import { TimeProvider } from "@/components/TimeProvider";

interface AuthItem {
  id: string;
  name: string;
  issuer: string;
  code: string;
}

const initialCodes: AuthItem[] = [
  {
    id: "1",
    name: "admin@example.com",
    issuer: "GitHub",
    code: "123 456",
  },
  {
    id: "2",
    name: "john.doe@company.com",
    issuer: "Google",
    code: "987 654",
  },
  {
    id: "3",
    name: "admin@example.com",
    issuer: "GitHub",
    code: "123 456",
  },
  {
    id: "4",
    name: "admin@example.com",
    issuer: "GitHub",
    code: "123 456",
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: (i + 0x12).toString(),
    name: `admin@example.com ${i + 1}`,
    issuer: "GitHub",
    code: "123 456",
  })),
];

export default function Home() {
  return (
    <TimeProvider>
      <AuthContent initialCodes={initialCodes} />
    </TimeProvider>
  );
}
