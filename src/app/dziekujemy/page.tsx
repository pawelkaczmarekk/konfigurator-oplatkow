export default function DziekujemyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">Dziękujemy!</h1>

        <p className="text-gray-600 mb-2 leading-relaxed">
          Twój projekt opłatka został zapisany i przekazany do realizacji.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          W razie pytań prosimy o kontakt ze sprzedawcą.
        </p>

        <div className="w-16 h-0.5 bg-amber-200 mx-auto mb-8" />

        <p className="text-xs text-gray-300">
          Konfigurator opłatków
        </p>
      </div>
    </div>
  );
}