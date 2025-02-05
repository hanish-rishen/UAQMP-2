interface AIAnalysisProps {
  assessment: string;
  recommendations: string[];
  weatherImpact: string[];  // renamed from weather
}

export default function AIAnalysisCard({ assessment, recommendations, weatherImpact }: AIAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
        <h5 className="font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Air Quality Assessment
        </h5>
        <p className="mt-2 text-sm text-blue-600 dark:text-blue-200">{assessment}</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
        <h5 className="font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Health Recommendations
        </h5>
        <ul className="mt-2 space-y-1">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-yellow-600 dark:text-yellow-200 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
        <h5 className="font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather Impact Analysis
        </h5>
        <ul className="mt-2 space-y-1">
          {weatherImpact.map((condition, idx) => (
            <li key={idx} className="text-sm text-purple-600 dark:text-purple-200 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {condition}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
