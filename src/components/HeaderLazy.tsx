"use client";
import { useDialogState } from "@/store/StateProvider";
import { downloadConfigJSON, handleFileImport } from "@/utils/export";
import {
  FileText,
  Github,
  PlusCircle,
  QrCode,
  ScanLine,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderLazyProps {
  codes: AuthItem[];
  onShowAddDialog: () => void;
  onShowScanDialog: () => void;
  onConfigImported?: () => void; // 导入成功后的回调
}

export function HeaderLazy({
  codes,
  onShowAddDialog,
  onShowScanDialog,
}: HeaderLazyProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setState } = useDialogState();

  // 点击外部时关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddDropdown(false);
      }
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleFileImport(
      file,
      (result) => {
        alert(result.message);
        window.location.reload();
      },
      (error) => {
        alert(`导入失败: ${error}`);
      }
    );

    // 清空input值，允许重复选择同一文件
    event.target.value = "";
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          古歌 验证器
        </h1>
        <div className="flex items-center gap-1">
          {codes.length > 0 && (
            <div className="relative" ref={exportDropdownRef}>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                <QrCode className="w-6 h-6 text-gray-900" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-1 w-38 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      setState({ showExportQRCode: true });
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    二维码导出
                  </button>
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      setState({ showWebRtcQRCode: true });
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    安全网络导出
                  </button>
                  <button
                    onClick={async () => {
                      setShowExportDropdown(false);
                      try {
                        await downloadConfigJSON();
                      } catch (error) {
                        console.error("JSON导出失败:", error);
                        alert("导出失败，请重试");
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    配置文件导出
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
            >
              <PlusCircle className="w-6 h-6 text-gray-900" />
            </button>

            {showAddDropdown && (
              <div className="absolute right-0 mt-1 w-38 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setShowAddDropdown(false);
                    onShowAddDialog();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  手动添加
                </button>
                <button
                  onClick={() => {
                    setShowAddDropdown(false);
                    onShowScanDialog();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  扫码添加
                </button>
                <button
                  onClick={() => {
                    setShowAddDropdown(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  导入配置
                </button>
                <button
                  onClick={() => {
                    window.open(
                      "https://github.com/sansan-mei/2fa-next",
                      "_blank"
                    );
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  项目地址
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </header>
  );
}

export default HeaderLazy;
