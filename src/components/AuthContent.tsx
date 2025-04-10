"use client";

import { rsaEncrypt } from "@/utils/crypto";
import {
  generateExportQRCode,
  importData,
  parseBase64Data,
} from "@/utils/export";
import {
  deleteSecret,
  getAllSecrets,
  getSecret,
  saveSecret,
} from "@/utils/idb";
import { parseTOTPQRCode } from "@/utils/qr";
import { get, post } from "@/utils/request";
import { generateTOTPCode, generateToTpCodeByIDB } from "@/utils/totp";
import { Download, PlusCircle, QrCode, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddCodeDialog } from "./AddCodeDialog";
import { AuthCode } from "./AuthCode";
import { ScanDialog } from "./ScanDialog";
import { useTimeRemaining } from "./TimeProvider";

interface ExportDataItem {
  id: string;
  secret: string;
  title: string;
  description?: string;
}

export function AuthContent() {
  const [codes, setCodes] = useState<AuthItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const timeRemaining = useTimeRemaining();
  const [showExportQRCode, setShowExportQRCode] = useState(false);
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部时关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // 处理扫描结果
  const handleScanResult = async (result: string) => {
    try {
      console.log("扫描结果:", result.substring(0, 50) + "..."); // 调试信息

      // 首先检查是否为有效的URL格式
      if (result.startsWith("otpauth://")) {
        // 处理标准TOTP二维码
        const parsed = parseTOTPQRCode(result);

        if (!parsed) {
          alert("二维码格式错误或缺少必要信息");
          return;
        }

        // 添加到认证列表
        await handleAdd({
          title: parsed.account,
          key: parsed.secret,
          description: parsed.issuer,
        });

        alert("成功添加新的2FA认证码");
      } else {
        // 尝试解析为备份数据(Base64编码的JSON)
        try {
          // 解析备份数据
          const backupData = parseBase64Data(result);

          // 检查数据格式
          if (
            backupData.length === 0 ||
            !backupData[0].secret ||
            !backupData[0].title
          ) {
            console.error("Empty or invalid backup format:", backupData);
            throw new Error("无效或空的备份数据");
          }

          // 确认导入
          if (
            window.confirm(`找到${backupData.length}个2FA认证码，是否导入？`)
          ) {
            // 导入所有备份数据
            const importedCount = await importData(backupData);

            // 重新加载认证码
            const updatedCodes = await generateToTpCodeByIDB();
            setCodes(updatedCodes);

            alert(`成功导入${importedCount}个2FA认证码`);
          }
        } catch (error) {
          console.error("Failed to parse backup data:", error);
          alert(
            `无法识别的二维码格式：${
              error instanceof Error ? error.message : "未知错误"
            }\n请确保二维码包含有效的TOTP信息或备份数据。`
          );
        }
      }

      setShowScanDialog(false);
    } catch (error) {
      console.error("Failed to parse QR code:", error);
      alert(
        `无法解析二维码：${
          error instanceof Error ? error.message : "未知错误"
        }\n请确保二维码格式正确。`
      );
    }
  };

  // 导出所有数据为二维码
  const handleExportQRCode = async () => {
    try {
      const ids = await getAllSecrets();

      if (ids.length === 0) {
        alert("你还没有添加任何2FA认证码");
        return;
      }

      // 收集所有数据
      const exportData: ExportDataItem[] = [];
      for (const id of ids) {
        const value = await getSecret(id);
        if (value) {
          exportData.push({
            id: id as string,
            secret: value.secret,
            title: value.title,
            description: value.description,
          });
        }
      }

      // 生成QR码
      const dataUrl = await generateExportQRCode(exportData);
      setExportDataUrl(dataUrl);
      setShowExportQRCode(true);
    } catch (err) {
      console.error("导出数据失败:", err);
      alert("导出失败，请重试");
    }
  };

  // 关闭二维码对话框
  const closeQRCodeDialog = () => {
    setShowExportQRCode(false);
  };

  useEffect(() => {
    // 初始化时获取codes
    generateToTpCodeByIDB().then(setCodes);

    // 加载所有密钥
    const loadSecrets = async () => {
      const ids = await getAllSecrets();
      const secretsMap: Record<string, string> = {};

      for (const id of ids) {
        const value = await getSecret(id as string);
        if (value) {
          secretsMap[id as string] = value.secret;
          saveSecret(id as string, {
            secret: value.secret,
            title: value.title,
            description: value.description,
          });
        }
      }
    };

    loadSecrets();
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

  // 点击导出二维码时的处理函数
  const handleExportQRCodeDownload = () => {
    if (!exportDataUrl) return;

    const link = document.createElement("a");
    link.href = exportDataUrl;
    link.download = "2fa-backup.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            TOTP 验证器
          </h1>
          <div className="flex items-center gap-1">
            {codes.length > 0 && (
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={handleExportQRCode}
              >
                <QrCode className="w-6 h-6 text-gray-900" />
              </button>
            )}
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowAddDropdown(!showAddDropdown)}
              >
                <PlusCircle className="w-6 h-6 text-gray-900" />
              </button>

              {showAddDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      setShowAddDropdown(false);
                      setShowAddDialog(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    手动添加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDropdown(false);
                      setShowScanDialog(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    扫码添加
                  </button>
                </div>
              )}
            </div>
          </div>
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
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <PlusCircle className="w-4 h-4" />
                    手动添加
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={() => setShowScanDialog(true)}
                  >
                    <ScanLine className="w-4 h-4" />
                    扫码添加
                  </button>
                </div>
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

      {/* 导出二维码对话框 */}
      {showExportQRCode && exportDataUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeQRCodeDialog}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Backup QR Code
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              扫描此二维码可以导入所有2FA认证信息。请妥善保管，不要分享给他人。
            </p>
            <div
              ref={qrCodeRef}
              className="bg-white p-2 rounded border border-gray-200 mb-4"
            >
              <img
                src={exportDataUrl}
                alt="2FA Backup QR Code"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={closeQRCodeDialog}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                关闭
              </button>
              <button
                onClick={handleExportQRCodeDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCodeDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAdd}
      />

      <ScanDialog
        isOpen={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        onScan={handleScanResult}
      />
    </div>
  );
}
