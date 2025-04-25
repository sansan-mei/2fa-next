"use client";
import {
  generateExportQRCode,
  handleDownloadQRCode,
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
import {
  generateSnowflake,
  generateTOTPCode,
  generateToTpCodeByIDB,
} from "@/utils/totp";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Download, Loader2, PlusCircle, ScanLine } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTimeRemaining } from "../store/TimeProvider";
import _Lazy from "./_lazy";

const HeaderFallback = () => (
  <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
        古歌 验证器
      </h1>
      <div className="flex items-center gap-1">
        <div className="relative">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <PlusCircle className="w-6 h-6 text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  </header>
);
const HeaderLazy = _Lazy(() => import("./HeaderLazy"), <HeaderFallback />);
const AddCodeDialog = _Lazy(() => import("./AddCodeDialog"));
const ScanDialog = _Lazy(() => import("./ScanDialog"));
const SortableAuthCode = _Lazy(() => import("./SortableAuthCode"));

export function AuthContent() {
  const [codes, setCodes] = useState<AuthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const timeRemaining = useTimeRemaining();
  const [showExportQRCode, setShowExportQRCode] = useState(false);
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20, // 增加触发距离
        delay: 250, // 减少延迟时间
        tolerance: 5, // 添加容差值
        pressure: 0.5, // 添加压力阈值
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    const snowflakeId = generateSnowflake();

    await saveSecret(snowflakeId, {
      secret: key,
      title,
      description,
      order: codes.length,
    });
    setCodes((prev) => [
      ...prev,
      {
        id: snowflakeId,
        name: title,
        issuer: description,
        code: generateTOTPCode(key),
      },
    ]);
  };

  // 处理扫描结果
  const handleScanResult = async (result: string) => {
    try {
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
            order: value.order,
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
    setLoading(true);
    generateToTpCodeByIDB()
      .then(setCodes)
      .finally(() => setLoading(false));
  }, []);

  // 更新 TOTP 码的函数
  const updateToTpCodes = useCallback(async () => {
    const updatedCodes = await Promise.all(
      codes.map(async (v) => {
        const value = await getSecret(v.id);
        if (!value) {
          return v;
        }
        const newCode = generateTOTPCode(value.secret);
        // 如果新生成的 code 和当前显示的相同，则延迟更新
        if (newCode === v.code) {
          setTimeout(() => {
            const delayedCode = generateTOTPCode(value.secret);
            setCodes((prev) =>
              prev.map((item) =>
                item.id === v.id ? { ...item, code: delayedCode } : item
              )
            );
          }, 1500); // 延迟 1.5 秒后更新
        }
        return { ...v, code: newCode };
      })
    );
    if (updatedCodes.length > 0) {
      setCodes(updatedCodes);
    }
  }, [codes]);

  // 监听时间变化
  useEffect(() => {
    if (timeRemaining === 30) {
      updateToTpCodes();
    }
  }, [timeRemaining, updateToTpCodes]);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 页面重新可见时，立即更新一次 TOTP 码
        updateToTpCodes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateToTpCodes]);

  // 点击导出二维码时的处理函数
  const handleExportQRCodeDownload = () => handleDownloadQRCode(exportDataUrl);

  const handleEdit = async (id: string, newName: string, newIssuer: string) => {
    const lastCode = await getSecret(id);
    if (!lastCode) {
      return;
    }
    saveSecret(id, {
      title: newName,
      description: newIssuer,
      secret: lastCode.secret,
      order: lastCode.order,
    });
    setCodes((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, name: newName, issuer: newIssuer } : v
      )
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCodes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        // 更新 IndexedDB 中的数据
        newItems.forEach(async (item, index) => {
          const secret = await getSecret(item.id);
          if (secret) {
            await saveSecret(item.id, { ...secret, order: index });
          }
        });

        return newItems;
      });
    }
  };

  return (
    <Fragment>
      <HeaderLazy
        codes={codes}
        onExportQRCode={handleExportQRCode}
        onShowAddDialog={() => setShowAddDialog(true)}
        onShowScanDialog={() => setShowScanDialog(true)}
      />

      <main className="flex-1 overflow-auto pt-[72px] pb-4 px-4">
        <div className="max-w-7xl mx-auto mt-1.5">
          {loading ? (
            <div className="h-[calc(100vh-150px)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
              </div>
            </div>
          ) : codes.length === 0 ? (
            <div className="md:min-h-[calc(100vh-20rem)] flex items-center">
              <div className="max-w-md mx-auto flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg animate-in fade-in duration-500">
                <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  还没有认证码
                </h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  通过扫描二维码或输入密钥添加你的第一个2FA认证码
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={codes.map((code) => code.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max touch-none">
                  {codes.map((code) => (
                    <SortableAuthCode
                      key={code.id}
                      id={code.id}
                      name={code.name}
                      issuer={code.issuer}
                      code={code.code}
                      timeRemaining={(timeRemaining / 30) * 100}
                      onDelete={() => handleDelete(code.id)}
                      onEdit={(newName, newIssuer) =>
                        handleEdit(code.id, newName, newIssuer)
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
    </Fragment>
  );
}
