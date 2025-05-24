/* eslint-disable @next/next/no-img-element */
import { useDialogState } from "@/store/StateProvider";
import {
  exportAllDataJson,
  generateExportQRCode,
  handleDownloadQRCode,
} from "@/utils/export";
import { Download } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

const ExportDialog = () => {
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { setState, state } = useDialogState();

  const handleExportQRCodeDownload = () => handleDownloadQRCode(exportDataUrl);
  // 关闭二维码对话框
  const closeQRCodeDialog = () => setState({ showExportQRCode: false });

  // 导出所有数据为二维码
  const handleExportQRCode = async () => {
    try {
      const exportData = await exportAllDataJson(true);
      // 生成QR码
      const dataUrl = await generateExportQRCode(exportData);
      setExportDataUrl(dataUrl);
      setState({ showExportQRCode: true });
    } catch (err) {
      setExportDataUrl(null);
      setState({ showExportQRCode: false });
      console.error("导出数据失败:", err);
      alert("导出失败，请重试");
    }
  };

  useEffect(() => {
    if (state.showExportQRCode) {
      handleExportQRCode();
    }
  }, [state.showExportQRCode]);

  return (
    <Fragment>
      {state.showExportQRCode && exportDataUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeQRCodeDialog}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Backup QR Code
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              扫描此二维码可以导入所有2FA认证信息。请妥善保管，不要分享给他人。
            </p>
            <div
              ref={qrCodeRef}
              className="bg-white p-2 rounded border border-gray-200 mb-4"
            >
              <img
                src={exportDataUrl}
                alt="2FA Backup QR Code"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={closeQRCodeDialog}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                关闭
              </button>
              <button
                onClick={handleExportQRCodeDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export { ExportDialog as default };
