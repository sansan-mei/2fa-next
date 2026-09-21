"use client";
import { useDialogState } from "@/store/StateProvider";
import HeaderFallback from "@/ui/headerFallback";
import Loader from "@/ui/loader";
import { dndConfig, importData, parseBase64Data } from "@/utils/export";
import { deleteSecret, getSecret, saveSecret } from "@/utils/idb";
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
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusCircle, ScanLine } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTimeRemaining } from "../store/TimeProvider";
import _Lazy from "./_lazy";
import { watchTOTPCycle } from "@/utils/totp-cycle";

const HeaderLazy = _Lazy(() => import("./HeaderLazy"), <HeaderFallback />);
const AddCodeDialog = _Lazy(() => import("./AddCodeDialog"));
const ScanDialog = _Lazy(() => import("./ScanDialog"));
const SortableAuthCode = _Lazy(() => import("./SortableAuthCode"));
const ExportDialog = _Lazy(() => import("./ExportDialog"));
const WebRtcDialog = _Lazy(() => import("./WebRtcDialog"));

export function AuthContent() {
  const [codes, setCodes] = useState<AuthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { state, setState } = useDialogState();
  const { showScanDialog, showAddCodeDialog } = state;
  const timeRemaining = useTimeRemaining();

  const sensors = useSensors(
    useSensor(PointerSensor, dndConfig()),
    useSensor(TouchSensor, dndConfig())
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
      } else if (result.startsWith("rtc://")) {
        // 处理WebRTC连接二维码
        const peerId = result.slice(6);
        setState({ remotePeerId: peerId });
      } else {
        // 尝试解析为备份数据(Base64编码的JSON)
        try {
          // 解析备份数据
          const backupData = parseBase64Data(result);

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

      setState({ showScanDialog: false });
    } catch (error) {
      console.error("Failed to parse QR code:", error);
      alert(
        `无法解析二维码：${
          error instanceof Error ? error.message : "未知错误"
        }\n请确保二维码格式正确。`
      );
    }
  };

  const codesRef = useRef(codes);
  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  // Only merge generated codes, so a pending read cannot undo edits or deletions.
  const refreshVersion = useRef(0);
  const updateToTpCodes = useCallback(async () => {
    const version = ++refreshVersion.current;
    try {
      const entries = await Promise.all(codesRef.current.map(async ({ id }) => {
        const value = await getSecret(id);
        return [id, value ? generateTOTPCode(value.secret) : undefined] as const;
      }));
      if (version !== refreshVersion.current) return;
      const updates = new Map(entries);
      setCodes((current) => {
        let changed = false;
        const next = current.map((item) => {
          const code = updates.get(item.id);
          if (code === undefined || code === item.code) return item;
          changed = true;
          return { ...item, code };
        });
        return changed ? next : current;
      });
    } catch (error) {
      console.error("刷新验证码失败:", error);
    }
  }, []);

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

  const handleDragEnd = (event: DragEndEvent) => {
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

  useEffect(() => {
    // 初始化时获取codes
    setLoading(true);

    generateToTpCodeByIDB().then((updatedCodes) => {
      setCodes(updatedCodes);
      setLoading(false);
    });
  }, []);

  // Use the same local clock as TOTP generation. Countdown calibration is separate.
  useEffect(() => {
    if (loading) return;
    const stop = watchTOTPCycle(() => { void updateToTpCodes(); });
    return () => {
      stop();
      refreshVersion.current++;
    };
  }, [loading, updateToTpCodes]);

  return (
    <Fragment>
      <HeaderLazy
        codes={codes}
        onShowAddDialog={() => setState({ showAddCodeDialog: true })}
        onShowScanDialog={() => setState({ showScanDialog: true })}
      />

      <main className="flex-1 overflow-x-hidden pt-[72px] pb-4 px-4 will-change-scroll">
        <div className="max-w-7xl mx-auto mt-1.5">
          {loading ? (
            <Loader />
          ) : codes.length === 0 ? (
            <div className="md:min-h-[calc(100vh-20rem)] flex items-center">
              <div className="max-w-md mx-auto flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg animate-in fade-in duration-500">
                <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h2 className="text-lg font-medium text-gray-900">
                  还没有认证码
                </h2>
                <p className="text-sm text-gray-500 text-center mt-1">
                  通过扫描二维码或输入密钥添加你的第一个2FA认证码
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={() => setState({ showAddCodeDialog: true })}
                  >
                    <PlusCircle className="w-4 h-4" />
                    手动添加
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={() => setState({ showScanDialog: true })}
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
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max`}
                >
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

      <ExportDialog />

      <AddCodeDialog
        isOpen={showAddCodeDialog}
        onClose={() => setState({ showAddCodeDialog: false })}
        onAdd={handleAdd}
      />

      <ScanDialog
        isOpen={showScanDialog}
        onClose={() => setState({ showScanDialog: false })}
        onScan={handleScanResult}
      />

      <WebRtcDialog />
    </Fragment>
  );
}
