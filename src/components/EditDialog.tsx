"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, issuer: string) => void;
  initialName: string;
  initialIssuer?: string;
}

export function EditDialog({
  isOpen,
  onClose,
  onConfirm,
  initialName,
  initialIssuer = "",
}: EditDialogProps) {
  const [name, setName] = useState(initialName);
  const [issuer, setIssuer] = useState(initialIssuer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name, issuer);
  };

  const _onClose = () => {
    setName(initialName);
    setIssuer(initialIssuer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[90%] max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">编辑认证代码</h3>
          <button
            onClick={_onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：GitHub"
              required
            />
          </div>
          <div>
            <label
              htmlFor="issuer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              描述
            </label>
            <input
              type="text"
              id="issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：admin@example.com"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
