'use client';

// ==============================================
// Theme Builder UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  applyTheme,
  generateThemeFromColor,
  hexToHsl,
  hslToHex,
  isLightColor,
  getContrastColor,
  type CustomTheme,
  type ThemeColors,
} from '@/lib/theme-builder';

interface ThemeBuilderProps {
  currentTheme?: CustomTheme;
  onSave?: (theme: CustomTheme) => void;
  onPreview?: (theme: CustomTheme) => void;
}

export function ThemeBuilder({ currentTheme, onSave, onPreview }: ThemeBuilderProps) {
  const [theme, setTheme] = useState<CustomTheme>(currentTheme || DEFAULT_THEME);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'advanced'>('presets');
  const [previewMode, setPreviewMode] = useState(false);

  const handlePresetSelect = useCallback((presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      const newTheme: CustomTheme = {
        ...DEFAULT_THEME,
        ...preset,
        colors: preset.colors!,
        id: presetKey,
      };
      setTheme(newTheme);
      onPreview?.(newTheme);
    }
  }, [onPreview]);

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const handleGenerateFromPrimary = useCallback((color: string) => {
    const mode = isLightColor(theme.colors.background) ? 'light' : 'dark';
    const generated = generateThemeFromColor(color, mode);
    setTheme(prev => ({
      ...prev,
      colors: generated,
    }));
  }, [theme.colors.background]);

  const handleSave = () => {
    onSave?.(theme);
  };

  useEffect(() => {
    if (previewMode) {
      applyTheme(theme);
    }
  }, [theme, previewMode]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold">🎨 Theme Builder</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Customize your Fernhill experience
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['presets', 'custom', 'advanced'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'presets' && (
          <PresetGrid
            currentId={theme.id}
            onSelect={handlePresetSelect}
          />
        )}

        {activeTab === 'custom' && (
          <CustomColorPicker
            colors={theme.colors}
            onChange={handleColorChange}
            onGenerateFromPrimary={handleGenerateFromPrimary}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedSettings
            theme={theme}
            onChange={setTheme}
          />
        )}
      </div>

      {/* Preview */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <ThemePreview theme={theme} />
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={previewMode}
            onChange={e => setPreviewMode(e.target.checked)}
            className="rounded"
          />
          Live preview
        </label>
        <div className="flex-1" />
        <button
          onClick={() => setTheme(DEFAULT_THEME)}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Save Theme
        </button>
      </div>
    </div>
  );
}

function PresetGrid({ currentId, onSelect }: { currentId: string; onSelect: (key: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Object.entries(THEME_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`relative p-4 rounded-xl border-2 transition-all ${
            currentId === key
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          {/* Color preview circles */}
          <div className="flex gap-1 mb-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: preset.colors?.primary }}
            />
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow -ml-2"
              style={{ backgroundColor: preset.colors?.secondary }}
            />
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow -ml-2"
              style={{ backgroundColor: preset.colors?.accent }}
            />
          </div>
          <p className="text-sm font-medium">{preset.name}</p>
          {currentId === key && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function CustomColorPicker({
  colors,
  onChange,
  onGenerateFromPrimary,
}: {
  colors: ThemeColors;
  onChange: (key: keyof ThemeColors, value: string) => void;
  onGenerateFromPrimary: (color: string) => void;
}) {
  const colorFields: Array<{ key: keyof ThemeColors; label: string }> = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Text' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick generate */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <p className="text-sm font-medium mb-2">🪄 Magic: Pick a color to generate theme</p>
        <input
          type="color"
          value={colors.primary}
          onChange={e => onGenerateFromPrimary(e.target.value)}
          className="w-full h-12 rounded-lg cursor-pointer"
        />
      </div>

      {/* Individual colors */}
      <div className="grid grid-cols-2 gap-4">
        {colorFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors[key]}
                onChange={e => onChange(key, e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors[key]}
                onChange={e => onChange(key, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedSettings({
  theme,
  onChange,
}: {
  theme: CustomTheme;
  onChange: (theme: CustomTheme) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Animation speed */}
      <div>
        <label className="block text-sm font-medium mb-2">Animation Speed</label>
        <select
          value={theme.animations.speed}
          onChange={e =>
            onChange({
              ...theme,
              animations: { ...theme.animations, speed: e.target.value as 'slow' | 'normal' | 'fast' },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={theme.animations.reducedMotion}
            onChange={e =>
              onChange({
                ...theme,
                animations: { ...theme.animations, reducedMotion: e.target.checked },
              })
            }
            className="rounded"
          />
          <span>Reduce motion (accessibility)</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={theme.animations.enableParticles}
            onChange={e =>
              onChange({
                ...theme,
                animations: { ...theme.animations, enableParticles: e.target.checked },
              })
            }
            className="rounded"
          />
          <span>Enable particle effects</span>
        </label>
      </div>

      {/* Border radius */}
      <div>
        <label className="block text-sm font-medium mb-2">Corner Roundness</label>
        <input
          type="range"
          min="0"
          max="24"
          value={parseInt(theme.borderRadius.lg) || 12}
          onChange={e => {
            const val = parseInt(e.target.value);
            onChange({
              ...theme,
              borderRadius: {
                none: '0',
                sm: `${val * 0.25}px`,
                md: `${val * 0.5}px`,
                lg: `${val}px`,
                xl: `${val * 1.5}px`,
                full: '9999px',
              },
            });
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}

function ThemePreview({ theme }: { theme: CustomTheme }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <button
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
          >
            Primary
          </button>
          <button
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.secondaryForeground,
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
          >
            Secondary
          </button>
          <button
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.accentForeground,
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
          >
            Accent
          </button>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.card,
            color: theme.colors.cardForeground,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <p className="font-medium">Sample Card</p>
          <p style={{ color: theme.colors.mutedForeground }} className="text-sm">
            This is muted text
          </p>
        </div>
      </div>
    </div>
  );
}

// Theme toggle button (for nav)
export function ThemeToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Open theme builder"
    >
      🎨
    </button>
  );
}

export default ThemeBuilder;
