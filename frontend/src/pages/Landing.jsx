import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Landing = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const features = [
    {
      icon: "⚡",
      title: "Instant Transfers",
      description: "Send money to anyone instantly with secure, real-time transactions"
    },
    {
      icon: "🧾",
      title: "Split Bills",
      description: "Split expenses with friends and family effortlessly"
    },
    {
      icon: "⏰",
      title: "Scheduled Payments",
      description: "Automate recurring payments and never miss a due date"
    },
    {
      icon: "📊",
      title: "Smart Analytics",
      description: "Track your spending patterns with detailed insights"
    },
    {
      icon: "🔒",
      title: "Bank-Grade Security",
      description: "Your money and data are protected with advanced encryption"
    },
    {
      icon: "📱",
      title: "Mobile Responsive",
      description: "Manage your wallet seamlessly across all devices"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up in seconds with just your email and basic information"
    },
    {
      number: "02",
      title: "Start Transacting",
      description: "Send money, split bills, and schedule payments instantly"
    },
    {
      number: "03",
      title: "Track Everything",
      description: "Monitor all your transactions and spending in one place"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PaytmX
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div 
              className="inline-block mb-6"
              style={{
                transform: `translateY(${scrollY * 0.5}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <span className="text-7xl">💰</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Money, simplified.
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Send money instantly, split bills effortlessly, schedule payments automatically,
              and track every transaction—all in one beautiful, secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="px-8 py-4 bg-white text-gray-700 text-lg rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:text-indigo-600 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Animated Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                  J
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Good morning, John</div>
                  <div className="text-sm text-gray-500">Welcome back</div>
                </div>
              </div>
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Available Balance</div>
                <div className="text-4xl font-bold text-gray-900">₹45,789.50</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-xs font-medium text-gray-700">Send Money</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-2">🧾</div>
                  <div className="text-xs font-medium text-gray-700">Split Bills</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-2">⏰</div>
                  <div className="text-xs font-medium text-gray-700">Scheduled</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-xs font-medium text-gray-700">Analytics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to manage your money smarter
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl transition-shadow group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your security is our priority
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            We use JWT-based authentication, secure HTTPS connections, and 
            MongoDB transactions to ensure your data and money are always protected.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-lg mb-2">Secure Authentication</h3>
              <p className="text-blue-100 text-sm">JWT tokens protect every request</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-bold text-lg mb-2">Safe Transactions</h3>
              <p className="text-blue-100 text-sm">Atomic operations prevent data loss</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-bold text-lg mb-2">Privacy First</h3>
              <p className="text-blue-100 text-sm">Your data stays private always</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to simplify your payments?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users managing their money smarter with PaytmX
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">PaytmX</div>
              <p className="text-sm text-gray-400">
                Simplifying payments for everyone
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/signup')} className="hover:text-white">Sign Up</button></li>
                <li><button onClick={() => navigate('/signin')} className="hover:text-white">Sign In</button></li>
                <li><span className="cursor-pointer hover:text-white">Features</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white cursor-pointer">Send Money</li>
                <li className="hover:text-white cursor-pointer">Split Bills</li>
                <li className="hover:text-white cursor-pointer">Scheduled Payments</li>
                <li className="hover:text-white cursor-pointer">Analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white cursor-pointer">About</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
                <li className="hover:text-white cursor-pointer">Terms</li>
                <li className="hover:text-white cursor-pointer">Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 PaytmX. Built for learning purposes. A modern fintech demo application.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
