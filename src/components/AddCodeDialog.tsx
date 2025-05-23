"use client";

import { formatTOTPKey, validateTOTPKey } from "@/utils/validators";
import { X } from "lucide-react";
import { useState } from "react";

interface AddCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; description: string; key: string }) => void;
}

function AddCodeDialog({ isOpen, onClose, onAdd }: AddCodeDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");

  if (!isOpen) return null;

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setKey(value);

    const validation = validateTOTPKey(value);
    setKeyError(validation.error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateTOTPKey(key);

    if (title && key && validation.isValid) {
      onAdd({
        title,
        description,
        key: formatTOTPKey(key),
      });

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
            添加新的 TOTP 密钥
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
              placeholder="输入 TOTP 密钥（仅支持 A-Z 和 2-7）"
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

export { AddCodeDialog as default };
