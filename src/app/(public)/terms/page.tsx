
import { Separator } from "@/components/ui/separator"

export default function TermsOfServicePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <Separator />

        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
          <p>
            Welcome to Vox Populi. These Terms of Service ("Terms") govern your access to and use of our platform. By creating an account or using our services, you agree to be bound by these Terms.
          </p>
          
          <h2 className="text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing this website, you are agreeing to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
          </p>

          <h2 className="text-foreground">2. User Accounts</h2>
          <p>
            To access most features, you must register for an account. You must be at least 18 years old to create an account. You are responsible for safeguarding your account information, including your password and any two-factor authentication credentials. You agree to provide accurate and complete information and to keep this information up to date.
          </p>

          <h2 className="text-foreground">3. User-Generated Content</h2>
          <p>
            You retain ownership of the content you post to the platform ("User Content"). By posting User Content, you grant the operators of this website a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, and display that content in connection with operating the platform.
          </p>
          <p>You agree not to post content that is:</p>
          <ul>
            <li>Illegal, hateful, harassing, or threatening.</li>
            <li>Spam or unauthorized advertising.</li>
            <li>Infringing on intellectual property rights.</li>
            <li>Intended to impersonate others.</li>
          </ul>

          <h2 className="text-foreground">4. Community Guidelines and Moderation</h2>
          <p>
            This platform operates on a community-driven moderation system. Users may report content they believe violates these Terms. Reported content is subject to a community review process where eligible members vote on the outcome. Decisions made by the community, including content removal and account suspension, are binding. The operators of this website reserve the right to intervene in exceptional cases to maintain the integrity of the service.
          </p>

          <h2 className="text-foreground">5. Termination</h2>
          <p>
            You may terminate your account at any time through your account settings. The operators of this website may suspend or terminate your account if you are found to be in serious violation of these Terms, as determined by the community moderation process or by the operators directly.
          </p>

          <h2 className="text-foreground">6. Disclaimers and Limitation of Liability</h2>
          <p>
            The service is provided on an "as-is" and "as-available" basis. The operators of this website are not responsible for any User Content and will not be liable for any damages or loss resulting from your use of the service.
          </p>
          
          <h2 className="text-foreground">7. Changes to the Terms</h2>
          <p>
            The operators of this website reserve the right to modify these Terms at any time. We will notify you of any changes. Your continued use of the service after such changes constitutes your acceptance of the new Terms.
          </p>
          
           <h2 className="text-foreground">8. Contact Us</h2>
            <p>
              If you have questions or comments about these Terms of Service, please contact us.
            </p>
        </div>
      </div>
    </div>
  )
}
