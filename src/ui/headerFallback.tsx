import { PlusCircle } from "lucide-react";

const HeaderFallback = () => (
  <header className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-4 py-4 border-b border-gray-200">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
        古歌 验证器
      </h1>
      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            aria-label="添加新验证码"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <PlusCircle className="w-6 h-6 text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default HeaderFallback;
