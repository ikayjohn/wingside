'use client';

import React, { useState } from 'react';

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General Notice' },
    { id: 'guests', label: 'For Guests' },
    { id: 'employees', label: 'Prospective Employees' },
    { id: 'cookies', label: 'Cookie Policy' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="w-[80%] mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          LAST REVISED: January 5, 2025
        </p>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-300 mb-8">
          <div className="flex flex-wrap gap-2 md:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm md:text-base font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#552627]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="prose prose-lg max-w-none">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Wingside® Privacy Notice</h2>
                <p className="text-gray-700 leading-relaxed">
                  Thank you for visiting the Wingside® website. Your privacy is important to us. This Privacy Notice explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our services.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Personal information (name, email address, phone number, delivery address)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Payment information (processed securely through our payment partners)</li>
                  <li>Order preferences and dietary requirements</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Process and fulfill your orders</li>
                  <li>Provide customer support</li>
                  <li>Send you order confirmations and updates</li>
                  <li>Manage your Wingside Club loyalty account</li>
                  <li>Improve our products and services</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We may share your information with:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Service providers who assist our operations (payment processors, delivery services)</li>
                  <li>Wingside® restaurant locations for order fulfillment</li>
                  <li>Business partners (with your consent)</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Object to processing of your information</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">
                    privacy@wingside.ng
                  </a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h3>
                <p className="text-gray-700 leading-relaxed">
                  For questions about this Privacy Notice or our data practices, please contact our Privacy Office at{' '}
                  <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">
                    privacy@wingside.ng
                  </a>
                  {' '}or call 08091990199.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Statement for Guests</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This detailed Privacy Statement applies to all guests who interact with Wingside® restaurants, our website, mobile applications, or other services.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Collection of Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>Information You Provide:</strong>
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li><strong>Order Information:</strong> Name, phone number, email, delivery address, order details, payment information</li>
                  <li><strong>Account Information:</strong> Username, password, security questions, profile picture</li>
                  <li><strong>Loyalty Program:</strong> Wingside Club membership information, points, rewards, preferences</li>
                  <li><strong>Feedback:</strong> Survey responses, reviews, complaints, suggestions</li>
                  <li><strong>Marketing Preferences:</strong> Email subscriptions, SMS preferences, promotional choices</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>Information Automatically Collected:</strong>
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, order frequency</li>
                  <li><strong>Location Data:</strong> Approximate location for restaurant locator, delivery address</li>
                  <li><strong>Cookies and Tracking:</strong> See our Cookie Policy tab for details</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Use of Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-3">We use your information for the following purposes:</p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Order Processing and Service Delivery:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Process and confirm orders</li>
                  <li>Coordinate delivery or pickup</li>
                  <li>Communicate order status updates</li>
                  <li>Handle payment processing</li>
                  <li>Manage returns or complaints</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Account Management:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Create and maintain your account</li>
                  <li>Manage Wingside Club membership</li>
                  <li>Track loyalty points and rewards</li>
                  <li>Save preferences and order history</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Marketing and Communications:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Send promotional offers (with consent)</li>
                  <li>Share news and updates</li>
                  <li>Personalize recommendations</li>
                  <li>Conduct surveys and research</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Business Operations:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Improve products and services</li>
                  <li>Analyze business trends</li>
                  <li>Conduct audits and security checks</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Legal Bases for Processing</h3>
                <p className="text-gray-700 leading-relaxed mb-3">We process your information based on:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Contract Necessity:</strong> To fulfill orders and provide services</li>
                  <li><strong>Consent:</strong> For marketing communications and optional features</li>
                  <li><strong>Legal Obligation:</strong> To comply with tax, financial, and regulatory requirements</li>
                  <li><strong>Legitimate Interests:</strong> For business operations, fraud prevention, and security</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Disclosure of Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-3">We may share your information with:</p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Service Providers:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li><strong>Payment Processors:</strong> Paystack, Nomba (for payment processing)</li>
                  <li><strong>Delivery Services:</strong> Third-party logistics partners</li>
                  <li><strong>Technology Providers:</strong> Hosting, analytics, email services</li>
                  <li><strong>Marketing Partners:</strong> Social media platforms, advertising services</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Wingside® Restaurant Network:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Franchise locations for order fulfillment</li>
                  <li>Corporate locations for operational support</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Legal Requirements:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Law enforcement or regulatory authorities</li>
                  <li>Court orders or legal proceedings</li>
                  <li>To protect our rights, property, or safety</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Business Transfers:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Mergers, acquisitions, or sales of assets</li>
                  <li>With appropriate safeguards and notice</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Fulfill orders and provide services</li>
                  <li>Maintain account records</li>
                  <li>Comply with legal requirements (typically 7 years for financial records)</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  When you delete your account, we will deactivate or delete your information within 30 days, subject to legal retention requirements.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Data Subject Rights</h3>
                <p className="text-gray-700 leading-relaxed mb-3">Under applicable data protection laws, you have the right to:</p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Access:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Request a copy of your personal information we hold.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Rectification:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Request correction of inaccurate or incomplete information.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Erasure ("Right to be Forgotten"):</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Request deletion of your information in certain circumstances.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Restrict Processing:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Request limitation of how we use your information.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Data Portability:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Receive your information in a structured, machine-readable format.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Object:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Object to processing based on legitimate interests.
                </p>

                <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Right to Withdraw Consent:</p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Withdraw consent at any time where processing is based on consent.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-gray-700 leading-relaxed font-semibold">To exercise these rights:</p>
                  <p className="text-gray-700 leading-relaxed">
                    Email: <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">privacy@wingside.ng</a><br />
                    Phone: 08091990199<br />
                    We will respond within 30 days.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. International Data Transfers</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your information is primarily stored and processed in Nigeria. If we transfer data to other countries, we ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Children's Privacy</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at{' '}
                  <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">
                    privacy@wingside.ng
                  </a>
                  . We will take steps to delete such information.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Updates to This Privacy Statement</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Statement from time to time. We will notify you of material changes by posting the new notice on our website and updating the "Last Revised" date. Your continued use of our services after such changes constitutes acceptance of the updated Privacy Statement.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruitment Privacy Notice</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This Privacy Notice applies to prospective employees, applicants, and contractors who interact with Wingside® recruitment processes.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Last Revised: January 5, 2025
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  During the recruitment process, we collect:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Personal Information:</strong> Name, contact details, date of birth, national ID number</li>
                  <li><strong>Application Materials:</strong> CV/resume, cover letter, portfolio, references</li>
                  <li><strong>Employment History:</strong> Work experience, education, certifications</li>
                  <li><strong>Assessment Results:</strong> Test results, interview notes, evaluation scores</li>
                  <li><strong>Background Check Data:</strong> Criminal record, employment verification, education verification (with consent)</li>
                  <li><strong>Special Categories:</strong> Disability status (for diversity inclusion), health information (for workplace accommodations)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h3>
                <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Process and evaluate your job application</li>
                  <li>Conduct background checks (with your consent)</li>
                  <li>Verify your qualifications and experience</li>
                  <li>Communicate with you about your application status</li>
                  <li>Assess your fit for the role and company culture</li>
                  <li>Comply with employment laws and regulations</li>
                  <li>Maintain records for diversity and equal opportunity monitoring</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Legal Basis for Processing</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We process your information based on:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Contractual Necessity:</strong> To assess your suitability for employment</li>
                  <li><strong>Consent:</strong> For background checks and special category data</li>
                  <li><strong>Legal Obligation:</strong> Employment law, tax regulations, immigration compliance</li>
                  <li><strong>Legitimate Interests:</strong> Recruitment activities, workplace safety, reference checks</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Who Has Access</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Your application information is shared with:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>HR and recruitment team</li>
                  <li>Hiring managers and interviewers</li>
                  <li>Background check providers (with consent)</li>
                  <li>Reference contacts you provide</li>
                  <li>Applicant tracking system providers</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  We do not share your application data with third parties for marketing purposes.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We retain applicant information as follows:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Successful Candidates:</strong> Transferred to personnel file, retained for duration of employment + 7 years</li>
                  <li><strong>Unsuccessful Candidates:</strong> Retained for 2 years for future opportunities</li>
                  <li><strong>Withdrawn Applications:</strong> Deleted upon request</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  You may request deletion of your application at any time by contacting{' '}
                  <a href="mailto:careers@wingside.ng" className="text-blue-600 underline">
                    careers@wingside.ng
                  </a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  As an applicant, you have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Access your application data and recruitment records</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your application (within 30 days)</li>
                  <li>Withdraw consent for background checks</li>
                  <li>Request information about recruitment decisions</li>
                  <li>Object to automated decision-making in recruitment</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  To exercise these rights, contact{' '}
                  <a href="mailto:careers@wingside.ng" className="text-blue-600 underline">
                    careers@wingside.ng
                  </a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. Automated Decision-Making</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may use automated tools to screen applications, match qualifications, and schedule interviews. These tools assist but do not replace human judgment in hiring decisions. You have the right to request human review and to appeal automated decisions.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Equal Opportunity</h3>
                <p className="text-gray-700 leading-relaxed">
                  Wingside® is an equal opportunity employer. We collect diversity information voluntarily to monitor and improve our equal opportunity practices. This information is used solely for statistical purposes and is separated from hiring decisions.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Contact</h3>
                <p className="text-gray-700 leading-relaxed">
                  For questions about your privacy during the recruitment process, contact:{' '}
                  <a href="mailto:careers@wingside.ng" className="text-blue-600 underline">
                    careers@wingside.ng
                  </a>
                  {' '}or call 08091990199.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">WINGSIDE® FOODS COOKIE POLICY</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This Cookie Policy explains how Wingside® Foods uses cookies and similar technologies on our website and mobile applications.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Last Revised: January 5, 2025
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. What Are Cookies?</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Remembering your preferences</li>
                  <li>Keeping you signed in</li>
                  <li>Understanding how you use our website</li>
                  <li>Personalizing content and advertisements</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Types of Cookies We Use</h3>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Essential Cookies (Required)</p>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      These cookies are necessary for the website to function properly. They enable:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
                      <li>User authentication and account access</li>
                      <li>Shopping cart functionality</li>
                      <li>Payment processing security</li>
                      <li>Fraud prevention</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-2">Cannot be disabled.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Performance and Analytics Cookies</p>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      These cookies help us understand how visitors interact with our website:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
                      <li>Page views and user journeys</li>
                      <li>Time spent on pages</li>
                      <li>Error tracking and debugging</li>
                      <li>Device and browser information</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-2">Third-party: Google Analytics</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Functionality Cookies</p>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      These cookies remember your choices and preferences:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
                      <li>Language and region preferences</li>
                      <li>Store location selections</li>
                      <li>Remembering login details</li>
                      <li>Recently viewed items</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-2">First-party cookies.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed mb-2 font-semibold">Targeting and Advertising Cookies</p>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      These cookies are used to deliver relevant advertisements:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
                      <li>Ad personalization based on browsing history</li>
                      <li>Cross-site tracking for marketing campaigns</li>
                      <li>Social media engagement tracking</li>
                      <li>Conversion tracking for ad performance</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-2">Third-party: Facebook Pixel, Google Ads</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Third-Party Cookies</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We allow trusted third parties to place cookies on your device for the services listed below:
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Service</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Purpose</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Privacy Policy</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-2 text-sm">Google Analytics</td>
                        <td className="px-4 py-2 text-sm">Website analytics</td>
                        <td className="px-4 py-2 text-sm">
                          <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener">
                            View Policy
                          </a>
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2 text-sm">Google Ads</td>
                        <td className="px-4 py-2 text-sm">Advertising</td>
                        <td className="px-4 py-2 text-sm">
                          <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener">
                            View Policy
                          </a>
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2 text-sm">Facebook/Meta</td>
                        <td className="px-4 py-2 text-sm">Social media tracking</td>
                        <td className="px-4 py-2 text-sm">
                          <a href="https://www.facebook.com/privacy/policy/" className="text-blue-600 underline" target="_blank" rel="noopener">
                            View Policy
                          </a>
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2 text-sm">Paystack</td>
                        <td className="px-4 py-2 text-sm">Payment processing</td>
                        <td className="px-4 py-2 text-sm">
                          <a href="https://paystack.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener">
                            View Policy
                          </a>
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2 text-sm">Nomba</td>
                        <td className="px-4 py-2 text-sm">Payment processing</td>
                        <td className="px-4 py-2 text-sm">
                          <a href="https://nomba.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener">
                            View Policy
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. How to Manage Cookies</h3>

                <p className="text-gray-700 leading-relaxed mb-3 font-semibold">Browser Settings:</p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You can control cookies through your browser settings:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li><strong>Chrome:</strong> Settings {'>'} Privacy and security {'>'} Cookies and other site data</li>
                  <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Manage Website Data</li>
                  <li><strong>Firefox:</strong> Settings {'>'} Privacy & Security {'>'} Cookies and Site Data</li>
                  <li><strong>Edge:</strong> Settings {'>'} Cookies and site permissions {'>'} Manage cookies</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-3 font-semibold">Cookie Consent Banner:</p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you first visit our website, you will see a cookie consent banner where you can:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>Accept all cookies</li>
                  <li>Reject non-essential cookies</li>
                  <li>Manage preferences by category</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  You can change your cookie preferences at any time by clicking the "Cookie Settings" link in the footer.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Impact of Disabling Cookies</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  If you disable cookies, some features of our website may not function properly:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li>You may need to log in each time you visit</li>
                  <li>Your shopping cart may not persist between pages</li>
                  <li>Payment processing may be affected</li>
                  <li>Personalized recommendations will not work</li>
                  <li>Some pages may not load correctly</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  We recommend enabling essential cookies for the best experience.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Local Storage and Similar Technologies</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  In addition to cookies, we use similar technologies:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                  <li><strong>Local Storage:</strong> Stores data on your device for faster access and offline functionality</li>
                  <li><strong>Session Storage:</strong> Temporary storage during your browsing session</li>
                  <li><strong>Web Beacons:</strong> Tiny images that help track email opens and page views</li>
                  <li><strong>Fingerprinting:</strong> Device characteristics for fraud prevention (not for tracking)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. Cookies on Mobile Apps</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our mobile applications use device identifiers and similar technologies to provide functionality. Mobile apps may share data with third parties for analytics and advertising. You can control mobile ad tracking in your device settings (Limit Ad Tracking on iOS / Opt out of Ads Personalization on Android).
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Children and Cookies</h3>
                <p className="text-gray-700 leading-relaxed">
                  We do not target children under 13 with cookies or advertising. If you are a parent or guardian concerned about cookies, please review your browser settings and contact us at{' '}
                  <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">
                    privacy@wingside.ng
                  </a>
                  .
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Updates to This Policy</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or applicable law. Any changes will be posted on this page with an updated "Last Revised" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">10. Contact Us</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you have questions about our use of cookies, please contact us at{' '}
                  <a href="mailto:privacy@wingside.ng" className="text-blue-600 underline">
                    privacy@wingside.ng
                  </a>
                  {' '}or call 08091990199.
                </p>
              </section>

              <section className="bg-yellow-50 p-4 rounded-lg mt-6">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  By continuing to use our website, you consent to our use of cookies as described in this policy.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
