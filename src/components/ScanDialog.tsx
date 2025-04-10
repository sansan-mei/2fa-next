"use client";

import jsQR from "jsqr";
import { Camera, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}

export function ScanDialog({ isOpen, onClose, onScan }: ScanDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);

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

  // 使用jsQR库扫描二维码
  const scanQRFromImage = async (file: File) => {
    // 创建图像对象
    const imgBitmap = await createImageBitmap(file);

    // 使用jsQR库进行扫描
    await processWithJsQR(imgBitmap);
  };

  // 使用jsQR库进行扫描
  const processWithJsQR = async (imgBitmap: ImageBitmap) => {
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

  // 启动摄像头扫描
  const startVideoScan = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // 请求摄像头权限，优先使用后置摄像头
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // 开始扫描循环
      startScanningLoop();
    } catch (err) {
      console.error("摄像头访问错误:", err);
      setError("无法访问摄像头，请检查权限设置或尝试上传图片");
      setIsScanning(false);
    }
  };

  // 停止摄像头扫描
  const stopVideoScan = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsScanning(false);
  };

  // 扫描循环
  const startScanningLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 设置canvas尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 在canvas上绘制视频帧
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 获取图像数据
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // 使用jsQR库进行扫描
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          // 找到二维码
          stopVideoScan();
          onScan(code.data);
          return;
        }
      }

      // 继续扫描循环
      animationRef.current = requestAnimationFrame(scanFrame);
    };

    animationRef.current = requestAnimationFrame(scanFrame);
  };

  // 在对话框关闭或组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!isOpen && isScanning) {
      stopVideoScan();
    }
  }, [isOpen, isScanning]);

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

            {isScanning ? (
              <div className="flex flex-col items-center">
                <div className="relative w-full mb-4 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 border-opacity-50 pointer-events-none" />
                </div>
                <button
                  onClick={stopVideoScan}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  停止扫描
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-full mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="bg-gray-100 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={startVideoScan}
                    >
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2">
                        使用摄像头
                      </h4>
                      <p className="text-sm text-gray-500">实时扫描二维码</p>
                    </div>

                    <div
                      className="bg-gray-100 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={triggerFileInput}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2">
                        上传图片
                      </h4>
                      <p className="text-sm text-gray-500">从图片中识别</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm mb-4 max-w-sm text-center">
                    {error}
                  </div>
                )}
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
  );
}
