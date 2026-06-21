import Link from 'next/link';

const CONTRACT_ADDRESS = '0xd1e92a8E1c46788DF9Af923ebEAB49aea904501d';
const EXPLORER_URL = 'https://studio.genlayer.com';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-green-700 text-xl">Nutrigen</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-green-700 font-medium">Sign In</Link>
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Powered by GenLayer Decentralized AI Consensus
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            AI-Powered Livestock<br />
            <span className="text-green-600">Feed Optimization</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Get scientifically validated, cost-aware feed rations for your livestock — adjudicated by a decentralized network of AI validators on GenLayer's blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md">
              Start Optimizing Free
            </Link>
            <Link href="/login" className="border border-green-600 text-green-700 hover:bg-green-50 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Why Nutrigen?</h2>
          <p className="text-center text-gray-500 mb-12">Built for modern livestock operations that demand precision and transparency</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimal Rations</h3>
              <p className="text-gray-600">Multi-criteria AI analysis balances nutrient adequacy, species suitability, production stage requirements, and real-world ingredient availability to deliver the best possible feed plan.</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Safety Verified</h3>
              <p className="text-gray-600">Every ration is checked against toxin limits, anti-nutrient thresholds, ingredient interaction risks, and your custom feed standards before being approved for use.</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cost-Aware</h3>
              <p className="text-gray-600">Optimization factors in ingredient costs, supply availability, and seasonal constraints — so you get the best ration that your operation can actually afford and source.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-500 mb-14">From farm data to verified feed plan in four steps</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🏡', title: 'Add Farm & Livestock', desc: 'Register your farm and livestock batches with species, breed, production stage, and health data.' },
              { step: '02', icon: '🌾', title: 'Register Ingredients', desc: 'Add your available feed ingredients with nutrient profiles, safety data, and cost information.' },
              { step: '03', icon: '🤖', title: 'Submit to AI Consensus', desc: 'Your feed request is evaluated by multiple AI validators on GenLayer — no single point of failure.' },
              { step: '04', icon: '✅', title: 'Get Recommended Ration', desc: 'Receive a detailed, blockchain-verified feed plan with scores, risks, and feeding instructions.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{item.step}</div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to optimize your livestock nutrition?</h2>
          <p className="text-green-100 mb-8 text-lg">Join livestock operators using decentralized AI to improve herd health and reduce feed costs.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="bg-white text-green-700 hover:bg-green-50 px-8 py-3 rounded-lg font-semibold transition-colors">Create Free Account</Link>
            <Link href="/login" className="border border-green-300 text-white hover:bg-green-600 px-8 py-3 rounded-lg font-semibold transition-colors">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-bold text-white">Nutrigen</span>
            <span className="text-gray-600 ml-2">AI Livestock Feed Optimization</span>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-500">Contract: </span>
            <a
              href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 font-mono"
            >
              {CONTRACT_ADDRESS}
            </a>
            <span className="ml-3 text-gray-600">StudioNet · Chain 61999</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
