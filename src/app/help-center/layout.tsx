export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-primary text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-8 bg-white rounded-l-md mr-2"></span>
            <span className="font-bold text-xl">Tehuacán Brillante</span>
          </div>
          <h1 className="text-2xl font-semibold ml-4 hidden sm:block">Centro de Ayuda</h1>
          <div className="ml-auto">
            <a 
              href="/" 
              className="text-white hover:text-white/80 flex items-center border border-white/30 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              Volver a la plataforma
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
} 