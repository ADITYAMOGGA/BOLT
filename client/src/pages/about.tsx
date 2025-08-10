import { Navigation } from '@/components/navigation';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            About BOLT
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            BOLT is a fast, secure, and simple file sharing platform that allows you to upload files up to 200MB and share them instantly with secure links.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Fast & Secure
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your files are automatically deleted after 24 hours, ensuring privacy and security.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No Registration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start sharing immediately without any signup or personal information required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}