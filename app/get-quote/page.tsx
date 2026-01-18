import LeadCaptureForm from '@/components/LeadCaptureForm';

export const metadata = {
  title: 'Get a Quote - Wingside Catering & Events',
  description: 'Request a quote for catering, corporate events, or bulk orders from Wingside.',
};

export default function GetQuotePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get a Quote
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Planning an event or need catering? Fill out the form below and we'll get back to you within 24 hours with a custom quote.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Service Types */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Events & Catering</h3>
            <p className="text-gray-600 text-sm">Weddings, birthdays, corporate events, and special occasions</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Corporate Orders</h3>
            <p className="text-gray-600 text-sm">Regular office deliveries, meetings, and company events</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <span className="text-2xl">🍗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Orders</h3>
            <p className="text-gray-600 text-sm">Large parties, game days, and family gatherings</p>
          </div>
        </div>

        {/* What to Expect */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Happens Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold mb-3">1</div>
              <h3 className="font-semibold text-gray-900 mb-1">Submit Request</h3>
              <p className="text-gray-600 text-sm">Fill out the form with your event details</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold mb-3">2</div>
              <h3 className="font-semibold text-gray-900 mb-1">We Review</h3>
              <p className="text-gray-600 text-sm">Our team reviews your requirements</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold mb-3">3</div>
              <h3 className="font-semibold text-gray-900 mb-1">Get Quote</h3>
              <p className="text-gray-600 text-sm">Receive a custom quote within 24 hours</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold mb-3">4</div>
              <h3 className="font-semibold text-gray-900 mb-1">Confirm & Enjoy</h3>
              <p className="text-gray-600 text-sm">Confirm your order and enjoy great wings!</p>
            </div>
          </div>
        </div>

        {/* Quote Form */}
        <div className="max-w-3xl mx-auto">
          <LeadCaptureForm
            title="Request Your Quote"
            description="Tell us about your event or order. The more details you provide, the better we can tailor our quote to your needs."
            showCompany={true}
            showBudget={true}
            showTimeline={true}
            buttonText="Submit Quote Request"
          />
        </div>

        {/* Additional Info */}
        <div className="max-w-3xl mx-auto mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need urgent assistance?</h3>
          <p className="text-gray-600 mb-4">
            If you have an urgent request or need immediate assistance, please call us directly at <strong>+234 XXX XXX XXXX</strong>
          </p>
          <p className="text-gray-600 text-sm">
            Our team is available Monday - Sunday, 10am - 10pm to help with your inquiry.
          </p>
        </div>
      </div>
    </div>
  );
}
