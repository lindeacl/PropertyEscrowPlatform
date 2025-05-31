import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle, 
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button, Card, Grid } from '../components/ui';

const Homepage: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Multi-signature wallets and smart contract auditing ensure your funds are protected at all times.'
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Automated escrow release upon milestone completion. No waiting for manual processing.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Support for international property transactions with multi-currency capabilities.'
    },
    {
      icon: CheckCircle,
      title: 'Verified Participants',
      description: 'KYC verification and identity validation for all parties in the transaction.'
    }
  ];

  const stats = [
    { label: 'Properties Sold', value: '$2.4B', icon: DollarSign },
    { label: 'Active Escrows', value: '1,247', icon: FileText },
    { label: 'Average Settlement', value: '24hrs', icon: Clock },
    { label: 'Verified Users', value: '15K+', icon: Users }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Real Estate Developer',
      content: 'This platform revolutionized our property sales process. The transparency and security are unmatched.',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Property Investor',
      content: 'Finally, a solution that gives me confidence in cross-border property investments.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Secure Property Escrow Platform
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Revolutionary blockchain-powered escrow solution for global property transactions. 
              Secure, transparent, and efficient property sales with smart contract automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/escrow/create">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Start New Escrow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <Grid cols={4} gap="lg">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center" padding="lg">
                  <Icon className="h-8 w-8 mx-auto mb-4 text-blue-600" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </Card>
              );
            })}
          </Grid>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built for modern property professionals who demand security, transparency, and efficiency
            </p>
          </div>
          
          <Grid cols={2} gap="lg">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} padding="lg" className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Grid>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>
          
          <Grid cols={2} gap="lg" className="max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} padding="lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Award key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </Card>
            ))}
          </Grid>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Property Sales?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of property professionals using our secure escrow platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Today
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;