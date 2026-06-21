export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-3xl font-extrabold text-green-700">Nutrigen</h1>
          <p className="text-gray-500 text-sm mt-1">AI Livestock Feed Optimization</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
