"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

// 为BarcodeDetector定义接口
interface BarcodeDetectorOptions {
  formats: string[];
}

interface BarcodeResult {
  rawValue: string;
  format: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: Array<{ x: number; y: number }>;
}

interface BarcodeDetectorInterface {
  detect: (image: ImageBitmap) => Promise<BarcodeResult[]>;
}

// 扩展Window接口以包含BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: BarcodeDetectorOptions): BarcodeDetectorInterface;
    };
  }
}

interface ScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}

export function ScanDialog({ isOpen, onClose, onScan }: ScanDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 检查BarcodeDetector是否可用
  const isBarcodeDetectorSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      // 处理图片并扫描二维码
      await scanQRFromImage(file);
    } catch (err) {
      console.error("QR扫描错误:", err);
      setError("扫描二维码时出错，请尝试其他图片");
    }
  };

  // 使用原生扫码API或回退到jsQR库
  const scanQRFromImage = async (file: File) => {
    // 创建图像对象
    const imgBitmap = await createImageBitmap(file);

    if (isBarcodeDetectorSupported && window.BarcodeDetector) {
      try {
        // 使用原生BarcodeDetector API
        const barcodeDetector = new window.BarcodeDetector({
          formats: ["qr_code"],
        });

        const barcodes = await barcodeDetector.detect(imgBitmap);

        if (barcodes.length > 0) {
          // 找到二维码
          onScan(barcodes[0].rawValue);
        } else {
          setError("未能在图片中检测到有效的二维码");
        }
      } catch (error) {
        console.error("BarcodeDetector错误:", error);
        // 如果原生API失败，回退到使用jsQR库
        await fallbackToJsQR(imgBitmap);
      }
    } else {
      // 如果原生API不可用，回退到使用jsQR库
      await fallbackToJsQR(imgBitmap);
    }
  };

  // 回退到jsQR库进行扫描
  const fallbackToJsQR = async (imgBitmap: ImageBitmap) => {
    // 动态导入jsQR库
    const jsQR = (await import("jsqr")).default;

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // 设置canvas尺寸并绘制图像
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    context.drawImage(imgBitmap, 0, 0, imgBitmap.width, imgBitmap.height);

    // 从canvas获取图像数据
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      onScan(code.data);
    } else {
      setError("未能在图片中检测到有效的二维码");
    }
  };

  // 触发文件选择器
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:max-w-lg sm:w-full">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">扫描二维码</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm mb-4">
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    上传二维码图片
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    请上传包含二维码的图片进行识别
                  </p>

                  <button
                    onClick={triggerFileInput}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    选择图片
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4 max-w-sm text-center">
                  {error}
                </div>
              )}

              {/* 隐藏元素 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
