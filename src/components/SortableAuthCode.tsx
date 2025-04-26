"use client";

import { copyToClipboard } from "@/utils/clipboard";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Copy,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import _Lazy from "./_lazy";

const ConfirmDialog = _Lazy(() => import("./ConfirmDialog"));
const EditDialog = _Lazy(() => import("./EditDialog"));

interface SortableAuthCodeProps {
  id: string;
  name: string;
  issuer?: string;
  code: string;
  timeRemaining: number;
  onDelete?: () => void;
  onEdit?: (name: string, issuer: string) => void;
}

function SortableAuthCode(props: SortableAuthCodeProps) {
  const { code, timeRemaining, name, issuer, onDelete, onEdit } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: props.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 使用 requestAnimationFrame 确保在下一帧渲染动画
    requestAnimationFrame(() => {
      setShow(true);
    });
  }, []);

  const handleCopy = async () => {
    const success = await copyToClipboard(code.replace(/\s/g, ""));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group relative p-4 bg-white rounded-lg border border-gray-200 transition-all duration-500 ease-out hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:border-blue-300 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        onMouseLeave={() => setShowMenu(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out rounded-lg pointer-events-none" />

        <div className="relative flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-500 truncate">{issuer || "-"}</p>
          </div>
          <div
            ref={setActivatorNodeRef}
            className="relative ml-2 touch-none cursor-grab"
            {...attributes}
            {...listeners}
          >
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              {isDragging ? (
                <GripVertical className="w-5 h-5 text-blue-500" />
              ) : (
                <MoreVertical className="w-5 h-5 text-gray-500" />
              )}
            </button>

            <div
              className={`absolute right-0 mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 transition-all duration-200 ease-out ${
                showMenu
                  ? "transform-none opacity-100 visible"
                  : "transform -translate-y-1 opacity-0 invisible"
              }`}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowEditDialog(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteDialog(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between">
          <div className="text-2xl tracking-wider select-none group-hover:text-blue-700 transition-colors">
            <span className="mr-1.5">{code.slice(0, 3)}</span>
            <span>{code.slice(3)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
              <div
                className="w-6 h-6 rounded-full border-2 border-blue-500 transition-all duration-200 ease-linear group-hover:border-blue-600"
                style={{
                  background: `conic-gradient(#3b82f6 ${timeRemaining}%, transparent ${timeRemaining}%)`,
                }}
              />
            </div>
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-all relative group/copy"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500 animate-in fade-in-0 duration-200" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              )}
              <span className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {copied ? "已复制" : "复制代码"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="删除认证代码"
        description={`确定要删除 ${issuer} (${name}) 的认证代码吗？此操作无法撤销。`}
      />

      <EditDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onConfirm={(newName, newIssuer) => {
          onEdit?.(newName, newIssuer);
          setShowEditDialog(false);
        }}
        initialName={name}
        initialIssuer={issuer}
      />
    </div>
  );
}

export { SortableAuthCode as default };
