"use client";

import { rsaEncrypt } from "@/utils/crypto";
import { deleteSecret, getSecret, saveSecret } from "@/utils/idb";
import { get, post } from "@/utils/request";
import { generateTOTPCode, generateToTpCodeByIDB } from "@/utils/totp";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AddCodeDialog } from "./AddCodeDialog";
import { AuthCode } from "./AuthCode";
import { useTimeRemaining } from "./TimeProvider";

export function AuthContent() {
  const [codes, setCodes] = useState<AuthItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const timeRemaining = useTimeRemaining();

  const handleDelete = (id: string) => {
    deleteSecret(id);
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
    // 请求rsa公钥回来
    const { publicKey } = await get<{ publicKey: string }>({
      url: "http://localhost:3000/api/crypto",
    });

    const encrypted = rsaEncrypt(key, publicKey);

    const res = await post<AuthItem>({
      url: "http://localhost:3000/api/totp",
      data: {
        name: title,
        issuer: description,
        code: encrypted,
      },
    });

    await saveSecret(res.id, {
      secret: key,
      title,
      description,
    });
    setCodes((prev) => [...prev, res]);
  };

  useEffect(() => {
    // 初始化时获取codes
    generateToTpCodeByIDB().then(setCodes);
  }, []);

  useEffect(() => {
    if (timeRemaining === 30) {
      Promise.all(
        codes.map(async (v) => {
          const value = await getSecret(v.id);
          if (!value) {
            return v;
          }
          v.code = generateTOTPCode(value.secret);
          return v;
        })
      ).then((res) => {
        if (res.length === 0) {
          return;
        }
        setCodes(res);
      });
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
