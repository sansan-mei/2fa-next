"use client";
import { useDialogState } from "@/store/StateProvider";
import { Github, PlusCircle, QrCode, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderLazyProps {
  codes: AuthItem[];
  onShowAddDialog: () => void;
  onShowScanDialog: () => void;
}

export function HeaderLazy({
  codes,
  onShowAddDialog,
  onShowScanDialog,
}: HeaderLazyProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          古歌 验证器
        </h1>
        <div className="flex items-center gap-1">
          {codes.length > 0 && (
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setState({ showExportQRCode: true })}
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
    </header>
  );
}

export default HeaderLazy;
