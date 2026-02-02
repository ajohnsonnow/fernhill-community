'use client';

// ==============================================
// Personal Insights UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState } from 'react';
import {
  PERIOD_LABELS,
  INSIGHT_CARDS,
  EMPTY_INSIGHTS,
  generateInsightHeadline,
  calculateEngagementScore,
  getVibeEmoji,
  generateFunFacts,
  formatActivityForChart,
  type PersonalInsights,
  type InsightPeriod,
} from '@/lib/personal-insights';

interface InsightsDashboardProps {
  insights: PersonalInsights;
  onPeriodChange?: (period: InsightPeriod) => void;
}

export function InsightsDashboard({ insights, onPeriodChange }: InsightsDashboardProps) {
  const [period, setPeriod] = useState<InsightPeriod>(insights.period);

  const handlePeriodChange = (newPeriod: InsightPeriod) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const score = calculateEngagementScore(insights);
  const vibe = getVibeEmoji(score);
  const funFacts = generateFunFacts(insights);

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <InsightHeader
        headline={insights.summary.headline}
        score={score}
        vibe={vibe}
        trend={insights.summary.trend}
        trendPercent={insights.summary.trendPercent}
      />

      {/* Period selector */}
      <PeriodSelector
        current={period}
        onChange={handlePeriodChange}
      />

      {/* Quick stats cards */}
      <div className="grid grid-cols-2 gap-4">
        {INSIGHT_CARDS.map(card => (
          <StatCard
            key={card.id}
            title={card.title}
            icon={card.icon}
            value={card.metric(insights)}
            label={card.label}
            color={card.color}
          />
        ))}
      </div>

      {/* Activity chart */}
      <ActivityChart activity={insights.activity} />

      {/* Social connections */}
      <ConnectionsCard social={insights.social} />

      {/* Fun facts */}
      {funFacts.length > 0 && (
        <FunFactsCard facts={funFacts} />
      )}

      {/* Highlights */}
      {insights.highlights.length > 0 && (
        <HighlightsCard highlights={insights.highlights} />
      )}

      {/* Level progress */}
      <LevelProgressCard growth={insights.growth} />
    </div>
  );
}

function InsightHeader({
  headline,
  score,
  vibe,
  trend,
  trendPercent,
}: {
  headline: string;
  score: number;
  vibe: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm">Your Community Vibe</p>
          <h2 className="text-xl font-bold mt-1">{headline}</h2>
        </div>
        <div className="text-4xl">{vibe}</div>
      </div>
      
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-white/60 text-sm">/100</span>
        </div>
      </div>

      {trend !== 'stable' && (
        <div className={`mt-2 text-sm ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendPercent}% vs last period
        </div>
      )}
    </div>
  );
}

function PeriodSelector({
  current,
  onChange,
}: {
  current: InsightPeriod;
  onChange: (period: InsightPeriod) => void;
}) {
  const periods: InsightPeriod[] = ['week', 'month', 'quarter', 'year'];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {periods.map(period => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            current === period
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
          }`}
        >
          {PERIOD_LABELS[period]}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  label,
  color,
}: {
  title: string;
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ActivityChart({ activity }: { activity: PersonalInsights['activity'] }) {
  const { dayLabels, dayData } = formatActivityForChart(activity);
  const maxValue = Math.max(...dayData, 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold mb-4">📊 Activity by Day</h3>
      <div className="flex items-end justify-between h-32 gap-2">
        {dayLabels.map((day, i) => {
          const height = (dayData[i] / maxValue) * 100;
          const isToday = i === new Date().getDay();
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isToday ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-purple-500' : 'text-gray-500'}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectionsCard({ social }: { social: PersonalInsights['social'] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold mb-4">🤝 Connections</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <p className="text-2xl font-bold text-purple-500">+{social.connectionsGained}</p>
          <p className="text-xs text-gray-500">New Friends</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{social.messagesExchanged}</p>
          <p className="text-xs text-gray-500">Messages</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{social.peopleInteractedWith}</p>
          <p className="text-xs text-gray-500">Interactions</p>
        </div>
      </div>

      {social.topConnections.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Top Connections</p>
          <div className="flex gap-2">
            {social.topConnections.slice(0, 5).map(conn => (
              <div
                key={conn.userId}
                className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"
                title={`${conn.name} - ${conn.interactions} interactions`}
              >
                {conn.avatarUrl ? (
                  <img src={conn.avatarUrl} alt={conn.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {conn.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FunFactsCard({ facts }: { facts: string[] }) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4">
      <h3 className="font-semibold mb-3">💡 Fun Facts</h3>
      <ul className="space-y-2">
        {facts.map((fact, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <span>•</span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighlightsCard({ highlights }: { highlights: PersonalInsights['highlights'] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold mb-3">✨ Highlights</h3>
      <div className="space-y-3">
        {highlights.slice(0, 5).map(highlight => (
          <div key={highlight.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg">
              {highlight.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{highlight.title}</p>
              <p className="text-xs text-gray-500 truncate">{highlight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelProgressCard({ growth }: { growth: PersonalInsights['growth'] }) {
  const { levelProgress } = growth;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">🏆 Level Progress</h3>
        <span className="text-sm text-gray-500">
          Level {levelProgress.current}
        </span>
      </div>

      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
          style={{ width: `${levelProgress.percentToNext}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{growth.xpGained.toLocaleString()} XP earned</span>
        <span>{levelProgress.xpToNext.toLocaleString()} XP to Level {levelProgress.nextLevel}</span>
      </div>

      {growth.badgesEarned.length > 0 && (
        <div className="mt-4 flex gap-2">
          {growth.badgesEarned.slice(0, 4).map((badge, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-sm"
            >
              🏅
            </div>
          ))}
          {growth.badgesEarned.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
              +{growth.badgesEarned.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InsightsDashboard;
