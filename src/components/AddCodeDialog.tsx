"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface AddCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onAdd: (data: { title: string; description: string; key: string }) => void;
}

export function AddCodeDialog({ isOpen, onClose, onAdd }: AddCodeDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");

  if (!isOpen) return null;

  const validateKey = (value: string) => {
    // 移除空格
    const cleanKey = value.replace(/\s/g, "").toUpperCase();

    // Base32 字符集验证（A-Z 和 2-7）
    if (!/^[A-Z2-7]*$/.test(cleanKey)) {
      setKeyError("密钥只能包含字母 A-Z 和数字 2-7");
      return false;
    }

    // 长度验证（通常是 16、32 或 64 个字符）
    if (cleanKey.length > 0 && ![16, 32, 64].includes(cleanKey.length)) {
      setKeyError("密钥长度必须是 16、32 或 64 个字符");
      return false;
    }

    setKeyError("");
    return true;
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setKey(value);
    validateKey(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && key && validateKey(key)) {
      onAdd({ title, description, key: key.replace(/\s/g, "").toUpperCase() });
      setTitle("");
      setDescription("");
      setKey("");
      setKeyError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[90%] max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            添加新的 2FA Code
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：GitHub"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              描述
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              密钥 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="key"
              value={key}
              onChange={handleKeyChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                keyError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="输入 2FA 密钥（仅支持 A-Z 和 2-7）"
              required
            />
            {keyError && (
              <p className="mt-1 text-sm text-red-500 animate-in fade-in-0 duration-200">
                {keyError}
              </p>
            )}
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
              disabled={!!keyError}
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
