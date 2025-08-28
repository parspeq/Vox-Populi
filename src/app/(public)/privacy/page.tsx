
import { Separator } from "@/components/ui/separator"

export default function PrivacyPolicyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <Separator />

        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>
              The operators of this website are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
            
            <h2 className="text-foreground">1. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect on the Service includes:
            </p>
            <ul>
                <li>
                  <strong>Personal Data:</strong> Personally identifiable information, such as your username, email address, and age, that you voluntarily give to us when you register with the application.
                </li>
                 <li>
                  <strong>User-Generated Content:</strong> The content of posts, replies, and chat messages you create and share on the platform.
                </li>
                <li>
                  <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address and your client identifier, which are used for security and rate-limiting purposes.
                </li>
            </ul>

            <h2 className="text-foreground">2. How We Use Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
            </p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Enable user-to-user communications.</li>
                <li>Operate the community moderation system.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
            </ul>

            <h2 className="text-foreground">3. Legal Basis for Processing</h2>
            <p>
              We process your personal data on the following legal bases under the General Data Protection Regulation (GDPR):
            </p>
            <ul>
                <li><strong>Consent:</strong> We process your data upon your consent, which you provide by agreeing to this policy at sign-up.</li>
                <li><strong>Legitimate Interests:</strong> We process your data for our legitimate interests, such as providing a secure and functional platform, unless these interests are overridden by your data protection rights.</li>
            </ul>

             <h2 className="text-foreground">4. Data Retention</h2>
            <p>
                We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
            </p>

            <h2 className="text-foreground">5. Your Data Protection Rights</h2>
            <p>
              Under GDPR, you have certain data protection rights. These include:
            </p>
            <ul>
                <li>The right to access, update, or delete the information we have on you.</li>
                <li>The right of rectification.</li>
                <li>The right to object.</li>
                <li>The right of restriction.</li>
                <li>The right to data portability.</li>
                <li>The right to withdraw consent.</li>
            </ul>
            <p>
                You can exercise these rights by deleting your account from the settings page.
            </p>

             <h2 className="text-foreground">6. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2 className="text-foreground">7. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us.
            </p>
        </div>

      </div>
    </div>
  )
}
