"use client";

import { generateTOTPCode } from "@/utils/totp";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AddCodeDialog } from "./AddCodeDialog";
import { AuthCode } from "./AuthCode";
import { useTimeRemaining } from "./TimeProvider";

interface AuthItem {
  id: string;
  name: string;
  issuer: string;
  code: string;
  sourceKey: string;
}

interface AuthContentProps {
  initialCodes: AuthItem[];
}

export function AuthContent({ initialCodes }: AuthContentProps) {
  const [codes, setCodes] = useState<AuthItem[]>(initialCodes);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const timeRemaining = useTimeRemaining();

  const handleDelete = (id: string) => {
    setCodes((prev) => prev.filter((code) => code.id !== id));
  };

  const handleAdd = async ({
    title,
    key,
    description,
  }: {
    title: string;
    key: string;
    description: string;
  }) => {
    // 这里应该使用 key 生成实际的 TOTP code，目前用模拟数据
    const res = await fetch("http://localhost:3000/api/totp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: description, // 用 description 作为 name
        issuer: title, // 用 title 作为 issuer
        code: key, // 用 key 作为 code
      }),
    });
    const newCode = await res.json();
    setCodes((prev) => [...prev, newCode]);
  };

  useEffect(() => {
    if (timeRemaining === 0) {
      const newCodes = codes.map((v) => {
        v.code = generateTOTPCode(v.sourceKey);
        return v;
      });
      setCodes(newCodes);
    }
  }, [timeRemaining]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            2FA Authenticator
          </h1>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusCircle className="w-6 h-6 text-gray-900" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto pt-[72px] pb-4 px-4">
        <div className="max-w-7xl mx-auto mt-1.5">
          {codes.length === 0 ? (
            <div className="md:min-h-[calc(100vh-20rem)] flex items-center">
              <div className="max-w-md mx-auto flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg animate-in fade-in duration-500">
                <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No codes yet
                </h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Add your first 2FA code by scanning a QR code or entering a
                  setup key
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setShowAddDialog(true)}
                >
                  Add New Code
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
              {codes.map((code) => (
                <AuthCode
                  key={code.id}
                  name={code.name}
                  issuer={code.issuer}
                  code={code.code}
                  timeRemaining={(timeRemaining / 30) * 100}
                  onDelete={() => handleDelete(code.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddCodeDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
