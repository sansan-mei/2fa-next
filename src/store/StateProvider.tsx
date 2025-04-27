import { create } from "zustand";

type DialogState = {
  showExportQRCode: boolean;
  setShowExportQRCode: (show: boolean) => void;
  reset: () => void;
};

export const useDialogStore = create<DialogState>((set) => ({
  showExportQRCode: false,
  setShowExportQRCode: (show) => set({ showExportQRCode: show }),
  reset: () => set({ showExportQRCode: false }),
}));

// 兼容原有代码的钩子函数
export const useDialogState = () => {
  const showExportQRCode = useDialogStore((state) => state.showExportQRCode);
  const setShowExportQRCode = useDialogStore(
    (state) => state.setShowExportQRCode
  );

  return {
    state: { showExportQRCode },
    setState: (newState: { showExportQRCode: boolean }) => {
      setShowExportQRCode(newState.showExportQRCode);
    },
  };
};
