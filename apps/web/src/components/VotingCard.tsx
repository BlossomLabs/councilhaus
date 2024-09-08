'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import React, { useState } from 'react';

const VotingCard = ({ className, projects, maxVotedProjects = 3 }: { className: string, projects: string[], maxVotedProjects?: number }) => {
  const [votes, setVotes] = useState<{ [key: string]: number }>(
    Object.fromEntries(projects.map(project => [project, 0]))
  );
  const votedProjects = Object.keys(votes).filter(project => votes[project] ?? 0 > 0);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (project: string, value: number) => {
    const newValue = Math.max(0, value || 0);
    setVotes(prev => ({
      ...prev,
      [project]: newValue
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          Which project is doing better?
        </CardTitle>
      </CardHeader>
      <CardContent>
          {projects.length === 0 ? (
            <div>No projects to vote on</div>
          ) : (
            <>
              <h4 className="text-xl mb-6 text-accent">Cast Your Vote ({votedProjects.length} / {maxVotedProjects})</h4>
              {Object.entries(votes).map(([project, voteCount]) => (
                <div key={project} className="flex items-center justify-between mb-3">
                  <span className="flex-grow">{project}</span>
                  <div className="flex items-center">
                    <Button
                      disabled={voteCount <= 0}
                      onClick={() => handleVote(project, voteCount - 1)}
                      className="bg-gray-700 w-8 py-1 text-white rounded-r-none"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={voteCount}
                      onChange={(e) => handleVote(project, parseInt(e.target.value))}
                      className="w-16 bg-gray-600 text-center text-white rounded-none px-3 py-1 input-number-hide-arrows border-none"
                    />
                    <Button
                      disabled={votedProjects.length >= maxVotedProjects && !votes[project as keyof typeof votes]}
                      onClick={() => handleVote(project, voteCount + 1)}
                      className="bg-gray-700 w-8 py-1 text-white rounded-l-none"
                    >
                      +
                    </Button>
                    <span className="w-12 text-right">
                      {totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
      </CardContent>
      <CardFooter>
        <Button disabled={votedProjects.length < 1} className="w-full py-2 rounded-lg mt-4 font-bold">
          Vote
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VotingCard;