import { create } from "zustand";

type DialogState = {
  showExportQRCode: boolean;
  showWebRtcQRCode: boolean;
  showScanDialog: boolean;
  showAddCodeDialog: boolean;
  remotePeerId: string | undefined;
  setShowExportQRCode: (show: boolean) => void;
  setShowWebRtcQRCode: (show: boolean) => void;
  setShowScanDialog: (show: boolean) => void;
  setShowAddCodeDialog: (show: boolean) => void;
  setRemotePeerId: (peerId: string) => void;
  reset: () => void;
};

export const useDialogStore = create<DialogState>((set) => ({
  showExportQRCode: false,
  showWebRtcQRCode: false,
  showScanDialog: false,
  showAddCodeDialog: false,
  remotePeerId: undefined,
  setShowExportQRCode: (show) => set({ showExportQRCode: show }),
  setShowWebRtcQRCode: (show) => set({ showWebRtcQRCode: show }),
  setShowScanDialog: (show) => set({ showScanDialog: show }),
  setShowAddCodeDialog: (show) => set({ showAddCodeDialog: show }),
  setRemotePeerId: (peerId) => set({ remotePeerId: peerId }),
  reset: () =>
    set({
      showExportQRCode: false,
      showWebRtcQRCode: false,
      showScanDialog: false,
      showAddCodeDialog: false,
      remotePeerId: undefined,
    }),
}));

// 兼容原有代码的钩子函数
export const useDialogState = () => {
  const showExportQRCode = useDialogStore((state) => state.showExportQRCode);
  const showWebRtcQRCode = useDialogStore((state) => state.showWebRtcQRCode);
  const showScanDialog = useDialogStore((state) => state.showScanDialog);
  const showAddCodeDialog = useDialogStore((state) => state.showAddCodeDialog);
  const remotePeerId = useDialogStore((state) => state.remotePeerId);

  const _state = {
    showExportQRCode,
    showWebRtcQRCode,
    showScanDialog,
    showAddCodeDialog,
    remotePeerId,
  };

  const setShowExportQRCode = useDialogStore(
    (state) => state.setShowExportQRCode
  );
  const setShowWebRtcQRCode = useDialogStore(
    (state) => state.setShowWebRtcQRCode
  );
  const setShowScanDialog = useDialogStore((state) => state.setShowScanDialog);
  const setShowAddCodeDialog = useDialogStore(
    (state) => state.setShowAddCodeDialog
  );
  const setRemotePeerId = useDialogStore((state) => state.setRemotePeerId);

  function handleState(newState: {
    showExportQRCode?: boolean;
    showWebRtcQRCode?: boolean;
    showScanDialog?: boolean;
    showAddCodeDialog?: boolean;
    remotePeerId?: string | undefined;
  }) {
    if (newState.showExportQRCode !== undefined) {
      setShowExportQRCode(newState.showExportQRCode);
    }
    if (newState.showWebRtcQRCode !== undefined) {
      setShowWebRtcQRCode(newState.showWebRtcQRCode);
    }
    if (newState.showScanDialog !== undefined) {
      setShowScanDialog(newState.showScanDialog);
    }
    if (newState.showAddCodeDialog !== undefined) {
      setShowAddCodeDialog(newState.showAddCodeDialog);
    }
    if (newState.remotePeerId !== undefined) {
      setRemotePeerId(newState.remotePeerId);
    }
  }

  return {
    state: _state,
    setState: handleState,
  };
};
