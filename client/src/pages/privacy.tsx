import { Navigation } from '@/components/navigation';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Privacy Policy
          </h2>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Data Collection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We only collect the files you upload and basic metadata. No personal information is required or stored.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                File Security
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All files are automatically deleted after 24 hours. Access is only possible through unique sharing codes.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We do not use cookies or tracking technologies. Your privacy is our priority.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}