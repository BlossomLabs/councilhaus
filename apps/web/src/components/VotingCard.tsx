"use client";

import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import React, { useEffect, useState } from "react";
import VotingButton from "./VotingButton";

type Project = { account: `0x${string}`; name: string };
type Allocation = { [grantee: `0x${string}`]: number };

const VotingCard = ({
  className,
  council,
  projects,
  initialAllocation,
  votingPower,
  maxVotedProjects = 3,
  isLoading = false,
}: {
  className: string;
  council: `0x${string}` | undefined;
  projects: Project[];
  initialAllocation: Allocation | undefined;
  votingPower: number;
  maxVotedProjects?: number;
  isLoading: boolean;
}) => {
  const [votes, setVotes] = useState<Allocation>(
    Object.fromEntries(
      projects.map((project) => [
        project.account,
        initialAllocation?.[project.account] ?? 0,
      ]),
    ),
  );

  useEffect(() => {
    setVotes(
      Object.fromEntries(
        projects.map((project) => [
          project.account,
          initialAllocation?.[project.account] ?? 0,
        ]),
      ),
    );
  }, [initialAllocation, projects]);

  // Array of project addresses that have been voted on
  const votedProjects = (Object.keys(votes) as `0x${string}`[]).filter(
    (grantee) => (votes[grantee] ?? 0) > 0,
  );

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (grantee: `0x${string}`, value: number) => {
    setVotes((prev) => ({
      ...prev,
      [grantee]: Math.max(
        0,
        Math.min(value || 0, votingPower - totalVotes + (prev[grantee] || 0)),
      ),
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Which project is doing better?</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SkeletonVote />
        ) : projects.length === 0 ? (
          <div>No projects to vote on</div>
        ) : (
          <>
            <div className="flex justify-between">
              <h4 className="h-12 text-xl mb-6 text-accent flex-wrap">
                Cast Your Vote{" "}
                {projects.length > maxVotedProjects ? (
                  <span className="text-nowrap text-sm">
                    ({votedProjects.length} / {maxVotedProjects} projects)
                  </span>
                ) : null}
              </h4>
              <div className="text-sm mt-2">
                Used{" "}
                <span className="text-nowrap">
                  {totalVotes} / {votingPower}
                </span>
              </div>
            </div>
            {projects.map((project) => {
              return (
                <div
                  key={project.account}
                  className="flex items-center justify-between mb-3"
                >
                  <span className="flex-grow text-ellipsis overflow-hidden">
                    {project.name}
                  </span>
                  <VoteControls
                    project={project}
                    votes={votes}
                    handleVote={handleVote}
                    votingPower={votingPower}
                    maxVotedProjects={maxVotedProjects}
                    votedProjects={votedProjects}
                    totalVotes={totalVotes}
                  />
                </div>
              );
            })}
          </>
        )}
      </CardContent>
      <CardFooter>
        <VotingButton
          votes={votes}
          council={council}
          disabled={votedProjects.length < 1}
        />
      </CardFooter>
    </Card>
  );
};

function VoteControls({
  project,
  votes,
  handleVote,
  votingPower,
  maxVotedProjects,
  votedProjects,
  totalVotes,
}: {
  project: Project;
  votes: Allocation;
  handleVote: (grantee: `0x${string}`, value: number) => void;
  votingPower: number;
  maxVotedProjects: number;
  votedProjects: `0x${string}`[];
  totalVotes: number;
}) {
  const voteCount = votes[project.account] || 0;
  return (
    <>
      <div className="flex items-center">
        <Button
          disabled={voteCount <= 0}
          onClick={() =>
            handleVote(
              project.account,
              voteCount - Math.floor(votingPower / 10),
            )
          }
          className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-r-none"
        >
          -
        </Button>
        <Input
          disabled={
            !votingPower ||
            (votedProjects.length >= maxVotedProjects &&
              !votes[project.account])
          }
          type="number"
          value={voteCount}
          onChange={(e) =>
            handleVote(project.account, Number.parseInt(e.target.value))
          }
          className="w-16 bg-gray-600 text-center text-white rounded-none px-3 py-1 input-number-hide-arrows border-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default"
        />
        <Button
          disabled={
            (votedProjects.length >= maxVotedProjects &&
              !votes[project.account]) ||
            totalVotes >= votingPower
          }
          onClick={() =>
            handleVote(
              project.account,
              voteCount + Math.floor(votingPower / 10),
            )
          }
          className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-l-none"
        >
          +
        </Button>
        <span className="w-12 text-right hidden sm:block">
          {totalVotes > 0 ? Math.round((voteCount / votingPower) * 100) : 0}%
        </span>
      </div>
    </>
  );
}

function SkeletonVote() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="h-12 flex justify-between items-center">
        <Skeleton className="w-3/5 h-5" />
        <Skeleton className="w-1/5 h-3" />
      </div>

      <div className="space-y-2 mt-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

export default VotingCard;
