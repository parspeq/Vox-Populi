
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">About Vox Populi</h1>
        <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
          <p>
            Vox Populi - Latin for "voice of the people" - is a platform where
            users directly manage content and govern their communities, serving
            as a direct public experiment in social democracy.
          </p>
          <p>
            Vox Populi is a modern discussion platform built for dynamic community
            interaction. It combines traditional threaded forums with real-time
            chat and empowers its users with a unique, community-driven
            moderation system.
          </p>
        </div>

        <div className="pt-6 mt-6 border-t">
          <h2 className="text-2xl font-bold tracking-tight">Legal</h2>
          <p className="text-muted-foreground mt-2">
            Please review our legal documents. By using this service, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            {' '}and our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
