import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
            <Zap className="w-4 h-4 text-indigo-500" />
            Multi-platform Content Operations
          </div>
          
          {/* Headline */}
          <h1 className="text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Content-Ops Console
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Streamline your content publishing workflow across Twitter, Facebook, Instagram, YouTube, and Reddit.
          </p>
          
          {/* CTA */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button 
                size="lg" 
                className="rounded-xl px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 animate-fade-in stagger-2">
          {/* Feature 1 */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover-lift">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                One-Click Publishing
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Publish to multiple platforms simultaneously with a single click.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2 */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover-lift">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Secure OAuth
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Enterprise-grade security with OAuth 2.0 authentication.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3 */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover-lift">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Track performance across all your connected accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start Section */}
        <div className="mt-32 animate-fade-in stagger-3">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Three simple steps to streamline your content workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Connect Accounts
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Link your social media accounts with secure OAuth
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Create Content
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Write once, publish everywhere with our unified editor
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Track Results
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Monitor engagement and optimize your strategy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
