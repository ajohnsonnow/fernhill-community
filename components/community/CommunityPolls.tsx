'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, PlusCircle, Clock, Users } from 'lucide-react';

type Poll = {
  id: string;
  question: string;
  options: string[];
  created_by: string;
  created_at: string;
  expires_at: string | null;
  total_votes: number;
  profiles: { display_name: string; };
};

type PollResults = {
  option: string;
  votes: number;
  percentage: number;
};

export default function CommunityPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [showNewPoll, setShowNewPoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    expires_at: ''
  });
  const supabase = createClient();

  useEffect(() => {
    loadPolls();
  }, []);

  async function loadPolls() {
    const { data } = await supabase
      .from('community_polls')
      .select('*, profiles:created_by(display_name)')
      .order('created_at', { ascending: false }) as any;

    setPolls(data || []);
  }

  async function loadPollResults(pollId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user already voted
    if (user) {
      const { data: voteData } = await supabase
        .from('poll_votes')
        .select('selected_option')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single() as any;

      setUserVote(voteData?.selected_option || null);
    }

    // Get results using the helper function
    const { data } = await supabase.rpc('get_poll_results', { poll_id_param: pollId } as any) as any;
    
    if (data) {
      setResults(data.map((r: any) => ({
        option: r.option,
        votes: r.votes,
        percentage: r.percentage
      })));
    }
  }

  async function handleSubmitPoll(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const validOptions = newPoll.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    await supabase.from('community_polls').insert({
      question: newPoll.question,
      options: validOptions,
      expires_at: newPoll.expires_at || null,
      created_by: user.id
    } as any);

    setShowNewPoll(false);
    setNewPoll({ question: '', options: ['', ''], expires_at: '' });
    loadPolls();
  }

  async function submitVote(pollId: string, option: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('poll_votes').insert({
      poll_id: pollId,
      user_id: user.id,
      selected_option: option
    } as any);

    // Update total votes
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      await ((supabase.from('community_polls') as any)
        .update({ total_votes: (poll.total_votes || 0) + 1 })
        .eq('id', pollId));
    }

    setUserVote(option);
    loadPollResults(pollId);
    loadPolls();
  }

  function addOption() {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  }

  function removeOption(index: number) {
    if (newPoll.options.length <= 2) return;
    const newOptions = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: newOptions });
  }

  function openPoll(poll: Poll) {
    setSelectedPoll(poll);
    loadPollResults(poll.id);
  }

  function isExpired(poll: Poll): boolean {
    if (!poll.expires_at) return false;
    return new Date(poll.expires_at) < new Date();
  }

  if (selectedPoll) {
    const expired = isExpired(selectedPoll);

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedPoll(null);
            setUserVote(null);
            setResults([]);
          }}
          className="text-fernhill-gold hover:text-fernhill-terracotta font-medium"
        >
          ← Back to All Polls
        </button>

        {/* Poll Detail */}
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-fernhill-cream mb-4">{selectedPoll.question}</h2>

          {userVote || expired ? (
            // Show Results
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-fernhill-sand/80 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedPoll.total_votes || 0} votes
                </span>
                {expired && (
                  <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-medium">
                    Poll Closed
                  </span>
                )}
              </div>

              {results.map((result, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-fernhill-cream">
                      {result.option}
                      {userVote === result.option && (
                        <span className="ml-2 text-xs text-fernhill-gold">(Your vote)</span>
                      )}
                    </span>
                    <span className="text-fernhill-sand/80">
                      {result.votes} ({result.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-fernhill-brown rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-fernhill-gold h-full transition-all duration-500 dynamic-width"
                      style={{ '--dynamic-width': `${result.percentage}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show Voting Options
            <div className="space-y-3">
              {selectedPoll.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => submitVote(selectedPoll.id, option)}
                  className="w-full p-4 border-2 border-fernhill-earth/50 rounded-lg hover:border-fernhill-gold hover:bg-fernhill-gold/10 transition-colors text-left font-medium text-fernhill-cream"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-fernhill-earth/50 text-sm text-fernhill-sand/80">
            <div className="flex items-center justify-between">
              <span>
                Created by {selectedPoll.profiles?.display_name || 'Unknown'} •{' '}
                {new Date(selectedPoll.created_at).toLocaleDateString()}
              </span>
              {selectedPoll.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Expires {new Date(selectedPoll.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-fernhill-terracotta to-fernhill-gold text-fernhill-dark rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Community Polls</h2>
        </div>
        <p className="opacity-90">Have your say on community decisions</p>
      </div>

      {/* New Poll Button */}
      <button
        onClick={() => setShowNewPoll(!showNewPoll)}
        className="w-full bg-fernhill-gold text-fernhill-dark py-3 rounded-lg hover:bg-fernhill-terracotta font-medium"
      >
        + Create Poll
      </button>

      {/* New Poll Form */}
      {showNewPoll && (
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-fernhill-cream mb-4">Create a New Poll</h3>
          <form onSubmit={handleSubmitPoll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Question *</label>
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                placeholder="What do you want to ask?"
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Options * (minimum 2)</label>
              <div className="space-y-2">
                {newPoll.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-fernhill-gold hover:text-fernhill-terracotta text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="poll-expiration-input" className="block text-sm font-medium text-fernhill-cream mb-2">Expiration Date (Optional)</label>
              <input
                id="poll-expiration-input"
                type="datetime-local"
                value={newPoll.expires_at}
                onChange={(e) => setNewPoll({...newPoll, expires_at: e.target.value})}
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-fernhill-gold text-fernhill-dark py-2 rounded-lg hover:bg-fernhill-terracotta"
              >
                Create Poll
              </button>
              <button
                type="button"
                onClick={() => setShowNewPoll(false)}
                className="px-6 py-2 border border-fernhill-earth/50 rounded-lg text-fernhill-sand hover:bg-fernhill-brown/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Polls List */}
      <div className="space-y-3">
        {polls.length === 0 ? (
          <div className="bg-fernhill-charcoal rounded-lg shadow p-8 text-center text-fernhill-sand/70">
            No polls yet. Create one to get community input!
          </div>
        ) : (
          polls.map(poll => {
            const expired = isExpired(poll);
            return (
              <div
                key={poll.id}
                onClick={() => openPoll(poll)}
                className="bg-fernhill-charcoal rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-fernhill-cream flex-1">{poll.question}</h3>
                  {expired && (
                    <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-medium ml-2">
                      Closed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-fernhill-sand/80">
                  <span>
                    {poll.profiles?.display_name || 'Unknown'} •{' '}
                    {new Date(poll.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {poll.total_votes || 0} votes
                    </span>
                    {poll.expires_at && !expired && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(poll.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
