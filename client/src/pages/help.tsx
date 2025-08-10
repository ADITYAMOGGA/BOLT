import { Navigation } from '@/components/navigation';

export default function Help() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Help & FAQ
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                How to upload files?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simply drag and drop your files into the upload zone or click "Choose Files" to select files from your device. Files up to 200MB are supported.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                How long do files stay available?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All files are automatically deleted after 24 hours for security and privacy reasons.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                How do I share files?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                After uploading, you'll receive a 6-character code and a download link. Share either with others to give them access to your file.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! Files are only accessible through unique codes, and all data is automatically deleted after 24 hours. No registration or personal information is required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}