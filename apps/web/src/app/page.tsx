import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  DollarSign,
  Globe,
  Package,
  Shield,
  Users,
  Zap
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">KIRO ERP</span>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Next-Generation
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> ERP System</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Built with modern technologies for enterprise-scale operations.
            Featuring AI-powered analytics, real-time collaboration, and comprehensive business management.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" className="px-8">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Business Management
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to run your business efficiently, from financial management to manufacturing operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Financial Management</CardTitle>
                <CardDescription>
                  Complete accounting, invoicing, and financial reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">CRM & Sales</CardTitle>
                <CardDescription>
                  Lead management, opportunity tracking, and customer relations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Inventory Management</CardTitle>
                <CardDescription>
                  Multi-warehouse, serial tracking, and automated reordering
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Manufacturing</CardTitle>
                <CardDescription>
                  Production planning, BOM management, and shop floor control
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Built with Modern Technologies
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Leveraging the latest technologies for performance, scalability, and developer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                <CardTitle>High Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Built with NestJS, Fastify, and Next.js for lightning-fast performance and optimal user experience.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">NestJS</Badge>
                  <Badge variant="secondary">Fastify</Badge>
                  <Badge variant="secondary">Next.js 14</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Advanced security features including RBAC, MFA, SAML SSO, and comprehensive audit trails.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">JWT</Badge>
                  <Badge variant="secondary">RBAC</Badge>
                  <Badge variant="secondary">MFA</Badge>
                  <Badge variant="secondary">SAML 2.0</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Scalable Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Microservices architecture with GraphQL Federation, supporting thousands of concurrent users.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">GraphQL</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Redis</Badge>
                  <Badge variant="secondary">Docker</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using KIRO ERP to streamline their operations and drive growth.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" variant="secondary" className="px-8">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8 text-white border-white hover:bg-white hover:text-blue-600">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-xl font-bold">KIRO ERP</span>
              </div>
              <p className="text-gray-400">
                Next-generation ERP system for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KIRO ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
