"use client";

import { Check, Copy, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface AuthCodeProps {
  name: string;
  issuer: string;
  code: string;
  timeRemaining: number;
  onDelete?: () => void;
}

export function AuthCode({
  name,
  issuer,
  code,
  timeRemaining,
  onDelete,
}: AuthCodeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <div className="group relative p-4 bg-white rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 md:hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />

        <div className="relative flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {issuer}
            </h3>
            <p className="text-sm text-gray-500 truncate">{name}</p>
          </div>
          <div className="relative ml-2">
            <button
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 animate-in slide-in-from-top-2 duration-200 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteDialog(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-between">
          <div className="font-mono text-2xl tracking-wider select-all group-hover:text-blue-700 transition-colors">
            <span className="mr-1.5">{code.slice(0, 3)}</span>
            <span>{code.slice(3)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                {copied ? "Copied!" : "Copy code"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Authentication Code"
        description={`Are you sure you want to delete the authentication code for ${issuer} (${name})? This action cannot be undone.`}
      />
    </>
  );
}
