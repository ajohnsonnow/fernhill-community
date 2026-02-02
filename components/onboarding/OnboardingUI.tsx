'use client';

// ==============================================
// Magic Onboarding UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  ONBOARDING_STEPS,
  PREFERENCE_QUESTIONS,
  TOUR_STOPS,
  STEP_ANIMATIONS,
  calculateProgress,
  getNextStep,
  isOnboardingComplete,
  generateWelcomeMessage,
  type OnboardingStep,
  type OnboardingProgress,
  type QuizQuestion,
  type QuizResults,
} from '@/lib/magic-onboarding';

interface OnboardingWizardProps {
  userId: string;
  onComplete: (results: QuizResults) => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ userId, onComplete, onSkip }: OnboardingWizardProps) {
  const [progress, setProgress] = useState<OnboardingProgress>({
    userId,
    currentStepIndex: 0,
    completedSteps: [],
    skippedSteps: [],
    quizAnswers: {},
    startedAt: new Date(),
    completedAt: null,
    totalTimeSeconds: 0,
  });

  const currentStep = ONBOARDING_STEPS[progress.currentStepIndex];
  const progressPercent = calculateProgress(progress);

  const handleNext = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, currentStep.id],
      currentStepIndex: prev.currentStepIndex + 1,
    }));
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (currentStep.isRequired) return;
    setProgress(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, currentStep.id],
      currentStepIndex: prev.currentStepIndex + 1,
    }));
  }, [currentStep]);

  const handleQuizAnswer = useCallback((questionId: string, answer: string | string[]) => {
    setProgress(prev => ({
      ...prev,
      quizAnswers: { ...prev.quizAnswers, [questionId]: answer },
    }));
  }, []);

  const handleComplete = useCallback(() => {
    const results: QuizResults = {
      eventTypes: (progress.quizAnswers['event-types'] as string[]) || [],
      musicStyles: [],
      energyLevel: (progress.quizAnswers['energy-level'] as string) as QuizResults['energyLevel'] || 'varies',
      socialStyle: (progress.quizAnswers['social-style'] as string) as QuizResults['socialStyle'] || 'flexible',
      preferredTimes: (progress.quizAnswers['best-times'] as string[]) || [],
      communityGoals: (progress.quizAnswers['goals'] as string[]) || [],
    };
    onComplete(results);
  }, [progress.quizAnswers, onComplete]);

  // Check if finished
  useEffect(() => {
    if (progress.currentStepIndex >= ONBOARDING_STEPS.length) {
      handleComplete();
    }
  }, [progress.currentStepIndex, handleComplete]);

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 z-50 flex flex-col">
      {/* Progress bar */}
      <div className="p-4">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/70">
          <span>Step {progress.currentStepIndex + 1} of {ONBOARDING_STEPS.length}</span>
          <span>{progressPercent}% complete</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <StepRenderer
          step={currentStep}
          quizAnswers={progress.quizAnswers}
          onQuizAnswer={handleQuizAnswer}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </div>

      {/* Skip button */}
      {onSkip && !currentStep.isRequired && (
        <div className="p-4 text-center">
          <button
            onClick={handleSkip}
            className="text-white/60 hover:text-white text-sm underline"
          >
            Skip this step
          </button>
        </div>
      )}
    </div>
  );
}

interface StepRendererProps {
  step: OnboardingStep;
  quizAnswers: Record<string, string | string[]>;
  onQuizAnswer: (questionId: string, answer: string | string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}

function StepRenderer({ step, quizAnswers, onQuizAnswer, onNext, onSkip }: StepRendererProps) {
  const animationClass = getAnimationClass(step.animation);

  return (
    <div className={`w-full max-w-md ${animationClass}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{step.title}</h1>
        <p className="text-white/80">{step.subtitle}</p>
      </div>

      {/* Step-specific content */}
      {step.type === 'welcome' && (
        <WelcomeStep onNext={onNext} content={step.content.data as { paragraphs: string[]; ctaText: string }} />
      )}

      {step.type === 'quiz' && (
        <QuizStep
          questions={PREFERENCE_QUESTIONS}
          answers={quizAnswers}
          onAnswer={onQuizAnswer}
          onNext={onNext}
        />
      )}

      {step.type === 'tour' && (
        <TourStep stops={TOUR_STOPS} onComplete={onNext} />
      )}

      {step.type === 'complete' && (
        <CompleteStep onFinish={onNext} />
      )}

      {step.type === 'profile' && (
        <ProfileStep onNext={onNext} />
      )}

      {step.type === 'connections' && (
        <ConnectionsStep onNext={onNext} onSkip={onSkip} />
      )}
    </div>
  );
}

function WelcomeStep({ content, onNext }: { content: { paragraphs: string[]; ctaText: string }; onNext: () => void }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
      <div className="text-6xl mb-6">🌲</div>
      {content.paragraphs.map((p, i) => (
        <p key={i} className="text-white/90 mb-4">{p}</p>
      ))}
      <button
        onClick={onNext}
        className="mt-6 px-8 py-3 bg-white text-purple-600 font-bold rounded-full hover:scale-105 transition-transform"
      >
        {content.ctaText}
      </button>
    </div>
  );
}

function QuizStep({
  questions,
  answers,
  onAnswer,
  onNext,
}: {
  questions: QuizQuestion[];
  answers: Record<string, string | string[]>;
  onAnswer: (id: string, answer: string | string[]) => void;
  onNext: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const question = questions[currentQ];
  const currentAnswer = answers[question.id];

  const handleSelect = (value: string) => {
    if (question.type === 'multiple') {
      const current = (currentAnswer as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      onAnswer(question.id, updated);
    } else {
      onAnswer(question.id, value);
      // Auto-advance for single-select
      setTimeout(() => {
        if (currentQ < questions.length - 1) {
          setCurrentQ(currentQ + 1);
        }
      }, 300);
    }
  };

  const canContinue =
    question.type === 'multiple'
      ? (currentAnswer as string[])?.length > 0
      : Boolean(currentAnswer);

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onNext();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
      {/* Question */}
      <div className="text-center mb-6">
        <span className="text-4xl">{question.emoji}</span>
        <h2 className="text-xl font-bold text-white mt-2">{question.text}</h2>
        <p className="text-sm text-white/60 mt-1">
          {question.type === 'multiple' ? 'Select all that apply' : 'Pick one'}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map(option => {
          const isSelected =
            question.type === 'multiple'
              ? (currentAnswer as string[])?.includes(option.value as string)
              : currentAnswer === option.value;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.value as string)}
              className={`p-4 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-white text-purple-600 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="text-2xl block mb-1">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <div className="text-sm text-white/60">
          {currentQ + 1} / {questions.length}
        </div>
        <button
          onClick={handleNext}
          disabled={!canContinue}
          className="px-6 py-2 bg-white text-purple-600 font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQ < questions.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

function TourStep({ stops, onComplete }: { stops: typeof TOUR_STOPS; onComplete: () => void }) {
  const [currentStop, setCurrentStop] = useState(0);
  const stop = stops[currentStop];

  const handleNext = () => {
    if (currentStop < stops.length - 1) {
      setCurrentStop(currentStop + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
        <span className="text-4xl">
          {stop.id === 'events' && '📅'}
          {stop.id === 'hearth' && '🏠'}
          {stop.id === 'messages' && '💬'}
          {stop.id === 'profile' && '🌟'}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{stop.title}</h3>
      <p className="text-white/80 mb-6">{stop.description}</p>
      
      <div className="flex justify-center gap-2 mb-4">
        {stops.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i === currentStop ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      
      <button
        onClick={handleNext}
        className="px-6 py-2 bg-white text-purple-600 font-bold rounded-full"
      >
        {currentStop < stops.length - 1 ? 'Next' : 'Got it!'}
      </button>
    </div>
  );
}

function ProfileStep({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('');

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-4xl">
          📸
        </div>
        <p className="text-white/60 text-sm">Tap to add photo</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="What should we call you?"
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full mt-6 px-6 py-3 bg-white text-purple-600 font-bold rounded-full disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

function ConnectionsStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center">
      <div className="text-6xl mb-4">👥</div>
      <p className="text-white/80 mb-6">
        Connect with friends already in the community or invite new ones!
      </p>
      <div className="space-y-3">
        <button
          onClick={onNext}
          className="w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-full"
        >
          Find Friends
        </button>
        <button
          onClick={onSkip}
          className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-full"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Fernhill!</h2>
      <p className="text-white/80 mb-4">You earned +50 XP for completing onboarding!</p>
      <div className="inline-block px-4 py-2 bg-yellow-400/20 rounded-full text-yellow-300 text-sm font-medium mb-6">
        🏅 Newcomer Badge Unlocked!
      </div>
      <button
        onClick={onFinish}
        className="w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-full"
      >
        Start Exploring
      </button>
    </div>
  );
}

function getAnimationClass(animation: string): string {
  const classes: Record<string, string> = {
    'fade-up': 'animate-fade-up',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    'scale-up': 'animate-scale-up',
    'bounce': 'animate-bounce-in',
    'confetti': 'animate-fade-in',
    'particles': 'animate-fade-in',
  };
  return classes[animation] || 'animate-fade-in';
}

export default OnboardingWizard;
