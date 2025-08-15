'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Wallet, 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Lock,
  Globe,
  ChevronRight,
  Play
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to MantleLabs AI",
      subtitle: "Your intelligent DeFi copilot on Mantle Network",
      icon: Bot,
      content: (
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-32 h-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
            />
            <div className="absolute inset-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
              <Bot size={48} className="text-white" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Sparkles size={12} className="text-white" />
              </motion.div>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
            Meet your personal AI assistant for navigating decentralized finance. 
            Get portfolio insights, risk analysis, and strategic recommendations through natural conversation.
          </p>
        </div>
      )
    },
    {
      title: "Multi-Agent Intelligence",
      subtitle: "Specialized agents working together for you",
      icon: Sparkles,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BarChart3, title: "Portfolio Agent", desc: "Analyzes your holdings and diversification" },
            { icon: Shield, title: "Risk Agent", desc: "Assesses safety and provides warnings" },
            { icon: TrendingUp, title: "Strategy Agent", desc: "Suggests optimal DeFi strategies" }
          ].map((agent, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <agent.icon size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{agent.title}</h3>
              <p className="text-gray-400 text-sm">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Mantle Network Optimized",
      subtitle: "Built specifically for Mantle's DeFi ecosystem",
      icon: Globe,
      content: (
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-4 border-green-500/30 rounded-full"
              />
              <div className="absolute inset-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Globe size={32} className="text-white" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Agni Finance', 'FusionX', 'Lendle', 'MantleSwap'].map((protocol, index) => (
              <motion.div
                key={protocol}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-center"
              >
                <span className="text-gray-300 text-sm font-medium">{protocol}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-gray-400 text-center">
            Deep integration with Mantle's top DeFi protocols for seamless interactions
          </p>
        </div>
      )
    },
    {
      title: "Three Phases of Power",
      subtitle: "Unlock features as you connect and engage",
      icon: Zap,
      content: (
        <div className="space-y-6">
          {[
            {
              phase: "Phase 1",
              title: "Education & Learning",
              desc: "Ask questions about DeFi, protocols, and strategies",
              icon: Bot,
              status: "active"
            },
            {
              phase: "Phase 2", 
              title: "Portfolio Analysis",
              desc: "Connect wallet for portfolio insights and risk assessment",
              icon: BarChart3,
              status: "connect-wallet"
            },
            {
              phase: "Phase 3",
              title: "Smart Execution",
              desc: "Execute DeFi transactions through natural language",
              icon: Zap,
              status: "coming-soon"
            }
          ].map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-center gap-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                phase.status === 'active' ? 'bg-green-500' :
                phase.status === 'connect-wallet' ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                <phase.icon size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{phase.phase}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-white font-medium">{phase.title}</span>
                  {phase.status === 'coming-soon' && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{phase.desc}</p>
              </div>
              <ChevronRight className="text-gray-500" size={20} />
            </motion.div>
          ))}
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'w-8 bg-blue-500' :
                    index < currentStep ? 'w-4 bg-green-500' : 'w-4 bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 md:p-12 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6"
            >
              <IconComponent size={32} className="text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {currentStepData.title}
            </h1>
            <p className="text-xl text-gray-300 font-medium">
              {currentStepData.subtitle}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-12">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentStep === 0 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => onComplete()}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 
                           hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl 
                           transition-all duration-200 shadow-lg"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Play size={18} />
                    Start Chat
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            🔒 Your wallet data is secure and processed locally
          </p>
        </div>
      </div>
    </div>
  );
}