"use client";

import React from 'react';
import Link from 'next/link';

export default function KidsPage() {
  const [selectedFlavor, setSelectedFlavor] = React.useState('');
  const [selectedCake, setSelectedCake] = React.useState('');
  const [cartCount, setCartCount] = React.useState(0);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState('');
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    eventDate: '',
    numberOfKids: '',
    packageType: '',
    moreDetails: ''
  });

  const handleAddToCart = () => {
    if (!selectedFlavor || !selectedCake) {
      alert('Please select both a wing flavor and cake slice');
      return;
    }

    // Create cart item matching order page structure
    const cartItem = {
      id: Date.now(),
      name: `The Genius (${selectedCake})`,
      flavor: selectedFlavor,
      size: 'Kids Meal',
      price: 5000,
      quantity: 1,
      image: '/kids-the-genius.jpg'
    };

    // Get existing cart from localStorage (using same key as order page)
    const existingCart = JSON.parse(localStorage.getItem('wingside-cart') || '[]');

    // Add new item to cart
    existingCart.push(cartItem);

    // Save to localStorage
    localStorage.setItem('wingside-cart', JSON.stringify(existingCart));

    // Update cart count
    setCartCount(existingCart.length);

    // Reset selections
    setSelectedFlavor('');
    setSelectedCake('');

    alert('The Genius added to cart!');
  };

  // Load cart count on component mount
  React.useEffect(() => {
    const existingCart = JSON.parse(localStorage.getItem('wingside-cart') || '[]');
    setCartCount(existingCart.length);
  }, []);

  const handleScrollToMenu = () => {
    const menuSection = document.getElementById('kids-menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookNow = (packageName: string) => {
    setSelectedPackage(packageName);
    setFormData(prev => ({ ...prev, packageType: packageName }));
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailBody = `
Wingside Kids Party Package Booking

Contact Information:
- Full Name: ${formData.fullName}
- Email: ${formData.email}
- Phone: ${formData.phone}

Event Details:
- Package Type: ${formData.packageType}
- Event Date: ${formData.eventDate}
- Number of Kids: ${formData.numberOfKids}

Additional Details:
${formData.moreDetails}

---
This request was submitted through the Wingside Kids page.
    `;

    const mailtoLink = `mailto:reachus@wingside.ng?subject=Wingside Kids Party Booking - ${formData.fullName}&body=${encodeURIComponent(emailBody)}&cc=${formData.email}`;

    window.location.href = mailtoLink;

    // Reset form and close modal
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      eventDate: '',
      numberOfKids: '',
      packageType: '',
      moreDetails: ''
    });
    setIsFormOpen(false);
  };

  const wingFlavors = [
    'BBQ Fire',
    'BBQ Rush',
    'Braveheart',
    'Cameroon Rub',
    'Caribbean Jerk',
    'Dragon Breath',
    'Gustavo',
    'Hot Nuts',
    'Italian',
    'Lemon Pepper',
    'Mango Heat',
    'Sweet Dreams',
    'Tequila Wingrise',
    'The Slayer',
    'Tokyo',
    'Wing of the North',
    'Wingferno',
    'Whiskey Vibes',
    'Yaji',
    'Yellow Gold'
  ];

  const cakeOptions = [
    "Banana Cake Slice",
    "Chocolate Cake Slice",
    "Vanilla Cake Slice"
  ];

  const partyPackages = [
    {
      name: "Wingside Birthday Box",
      description: "Complete party package for 10 kids",
      price: "350,000",
      image: "/kids-party-birthday.jpg",
      items: [
        "10 Winglets meals",
        "Birthday cake",
        "Decorations",
        "Party host",
        "Games & activities"
      ]
    },
    {
      name: "Deluxe Party Bundle",
      description: "Complete party package for 10 kids",
      price: "550,000",
      image: "/kids-party-deluxe.jpg",
      items: [
        "15 meals of choice",
        "Custom cake",
        "Premium decorations",
        "Mascot visit",
        "Photo booth"
      ]
    },
    {
      name: "Mini Celebration",
      description: "Complete party package for 10 kids",
      price: "85,000",
      image: "/kids-party-mini.jpg",
      items: [
        "5 Winglets meals",
        "Mini cake",
        "Balloons",
        "Party games"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Cart Icon */}
      <Link href="/order" className="fixed top-1/2 -translate-y-1/2 right-4 md:right-8 lg:right-16 z-50">
        <div className="w-14 h-14 bg-[#F7C400] rounded-full flex items-center justify-center hover:bg-[#e5b500] transition-colors shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </Link>

      {/* Hero Section */}
      <div className="relative bg-[#FDF5E5] px-4 md:px-8 lg:px-16 flex items-center" style={{ height: '750px' }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-[#F7C400]">Wingside Kids</span>
                <br />
                <span className="text-black">Where Little Wings<br />Take Flight!</span>
              </h1>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                Building early brand affinity and family loyalty through fun, food,<br />
                and unforgettable experiences.
              </p>
            </div>

            {/* Right Image */}
            <div className="flex justify-center">
              <img src="/kids-hero.png" alt="Captain Wingside" className="w-500 max-w-[538px] h-auto" loading="eager" />
            </div>
          </div>
        </div>
      </div>

      {/* Kids' Favorite Meals Section */}
      <div id="kids-menu" className="bg-white py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">Kids' Favorite Meals</h2>

          {/* Full Width Banner */}
          <div className="bg-gradient-to-r from-[#FDF5E5] to-[#FFE4CC] rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left: Image */}
              <div className="h-full min-h-[400px] md:min-h-[500px]">
                <img
                  src="/kids-the-genius.jpg"
                  alt="The Genius"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Right: Details */}
              <div className="p-8 md:p-12">
                <h3 className="text-4xl md:text-5xl font-bold text-black mb-4">The Genius Meal</h3>
                <p className="text-xl text-gray-700 mb-6">Perfect for little champions</p>

                {/* Meal Details */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
                  <h4 className="text-lg font-bold text-black mb-3">What's Included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-[#F7C400] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">3 Wings (choice of 20 flavors)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F7C400] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">French Fries</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F7C400] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">1 Juice Box</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F7C400] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">1 Cake Slice (Banana, Chocolate, or Vanilla)</span>
                    </li>
                  </ul>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Only</p>
                    <p className="text-4xl font-bold text-black">₦5,000</p>
                  </div>
                </div>

                <Link
                  href="/order#Kids"
                  className="inline-block w-full md:w-auto bg-[#F7C400] text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors text-center"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Party Packages Section - Dark */}
      <div className="bg-[#5D4037] py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block bg-[#F7C400] text-black px-6 py-2 rounded-full text-sm font-semibold mb-6">
              Starting from ₦300,000
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Make their special day unforgettable with<br />our amazing party packages!
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {partyPackages.map((pkg, index) => (
              <div key={index} className="bg-white rounded-3xl overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-black mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{pkg.description}</p>
                  <ul className="space-y-3 mb-8">
                    {pkg.items.map((item, i) => (
                      <li key={i} className="text-gray-700 text-base flex items-start">
                        <span className="text-[#F7C400] mr-3 text-lg">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleBookNow(pkg.name)}
                    className="w-full bg-[#F7C400] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-[#e5b500] transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meet Captain Wingside Section */}
      <div className="bg-white py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Image */}
            <div className="flex justify-center">
              <img src="/kids-hero.png" alt="Captain Wingside" className="w-full max-w-md h-auto" loading="lazy" />
            </div>

            {/* Right Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Meet Captain<br />
                <span className="text-[#F7C400]">Wingside!</span>
              </h2>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Our friendly mascot visits kids' parties, schools, hospitals, etc.—bringing joy wherever the little wings need it. Book Captain Wingside for your next event and watch the magic happen!
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-[#F7C400] mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Character Activity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F7C400] mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Photo Opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F7C400] mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Games & Fun</span>
                </li>
              </ul>
              <button
                onClick={() => handleBookNow('Captain Wingside Mascot Visit')}
                className="bg-[#F7C400] text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
              >
                Book Captain Wingside
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-black mb-2">Book Your Party Package</h3>
                  <p className="text-gray-600">{selectedPackage}</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-500 hover:text-black text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Number of Kids *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numberOfKids}
                      onChange={(e) => setFormData({...formData, numberOfKids: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Package Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.packageType}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={formData.moreDetails}
                    onChange={(e) => setFormData({...formData, moreDetails: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent resize-none"
                    placeholder="Any special requests or dietary requirements..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 border-2 border-gray-300 text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#F7C400] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors"
                  >
                    Submit Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
