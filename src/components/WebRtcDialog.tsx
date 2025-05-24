/* eslint-disable @next/next/no-img-element */
import { Data, useWebRtcConnection } from "@/hooks/useWebRtcConnection";
import { useDialogState } from "@/store/StateProvider";
import { exportAllDataJson, generatePeerIdQRCode } from "@/utils/export";
import { saveSecret } from "@/utils/idb";
import { Fragment, useEffect, useState } from "react";

const WebRtcDialog = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { setState, state } = useDialogState();
  const {
    peerId,
    connectToPeer,
    startCreatePeer,
    data,
    peer,
    sendData,
    isConnected,
    isInitiator,
    reset,
  } = useWebRtcConnection();
  const { remotePeerId } = state;
  // 关闭二维码对话框
  const closeQRCodeDialog = () => {
    setState({ showWebRtcQRCode: false });
  };

  // 生成二维码
  const generateQRCode = async () => {
    try {
      const dataUrl = await generatePeerIdQRCode(peerId);
      setQrCodeUrl(dataUrl);
    } catch (err) {
      setQrCodeUrl(null);
      console.error("生成二维码失败:", err);
      alert("生成失败，请重试");
    }
  };

  const handleSave = async (data: Data[]) => {
    const parsedData = data.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );
    for (const [index, item] of parsedData.flat().entries()) {
      const _item = item as ExportDataItem;
      const idbValue: IDBValue = {
        secret: _item.secret,
        title: _item.title,
        description: _item.description,
        order: item.order || index + 1,
      };
      await saveSecret(_item.id, idbValue);
    }
    return Promise.resolve(true);
  };

  /** 导出方，展开dialog的时候就创建peer */
  useEffect(() => {
    if (state.showWebRtcQRCode && peerId) {
      startCreatePeer();
      generateQRCode();
    }
  }, [state.showWebRtcQRCode]);

  // 发起方处理 peer 创建
  useEffect(() => {
    if (remotePeerId) {
      startCreatePeer();
    }
  }, [remotePeerId]);

  // 发起方处理连接
  useEffect(() => {
    if (peer && remotePeerId) {
      connectToPeer(remotePeerId);
    }
  }, [peer, remotePeerId]);

  // 导出方
  useEffect(() => {
    if (isConnected && state.showWebRtcQRCode) {
      const sendDataAsync = async () => {
        const data = await exportAllDataJson(false);
        sendData(data);
      };
      sendDataAsync();
    }
  }, [isConnected, state.showWebRtcQRCode]);

  // 发起方
  useEffect(() => {
    if (data.length && isInitiator) {
      handleSave(data).then(async () => {
        await reset();
        window.location.reload();
      });
    }
  }, [data, isInitiator]);

  return (
    <Fragment>
      {state.showWebRtcQRCode && qrCodeUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeQRCodeDialog}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              RTC安全连接二维码
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              扫描此二维码建立RTC连接传输数据
            </p>
            <div className="bg-white p-2 rounded border border-gray-200 mb-4">
              {peer ? (
                <img
                  src={qrCodeUrl}
                  alt="WebRTC Connection QR Code"
                  className="w-full h-auto"
                />
              ) : (
                <div className="text-center pt-2 px-2">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">正在创建连接...</p>
                </div>
              )}
            </div>
            <button
              onClick={closeQRCodeDialog}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export { WebRtcDialog as default };
