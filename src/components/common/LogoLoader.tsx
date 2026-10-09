// src/components/common/LogoLoader.tsx
export const LogoLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="animate-bounce">
      <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
        <path d="M50 10 L85 30 L50 50 L15 30 Z" fill="#5EEAD4" />
        <path d="M15 30 L50 50 L50 90 L15 70 Z" fill="#3730A3" />
        <path d="M85 30 L50 50 L50 90 L85 70 Z" fill="#4F46E5" />
        <path d="M62 52 L62 70 L76 61 Z" fill="#FFFFFF" />
      </svg>
    </div>
    <p className="text-sm text-slate-500 font-medium">Loading...</p>
  </div>
);