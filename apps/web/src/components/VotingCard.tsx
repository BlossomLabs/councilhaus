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
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteAllocation } from "../hooks/useWriteAllocation";
import VotingButton from "./VotingButton";

type Project = { grantee: `0x${string}`; name: string };

const VotingCard = ({
  className,
  council,
  projects,
  maxVotedProjects = 3,
  isLoading = false,
}: {
  className: string;
  council: `0x${string}` | undefined;
  projects: Project[];
  maxVotedProjects?: number;
  isLoading: boolean;
}) => {
  const [votes, setVotes] = useState<{ [grantee: `0x${string}`]: number }>(
    Object.fromEntries(projects.map((project) => [project.grantee, 0])),
  );

  // Array of project addresses that have been voted on
  const votedProjects = Object.keys(votes).filter(
    (grantee) => (votes[grantee as `0x${string}`] ?? 0) > 0,
  );

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (grantee: `0x${string}`, value: number) => {
    const newValue = Math.max(0, value || 0);
    setVotes((prev) => ({
      ...prev,
      [grantee]: newValue,
    }));
  };

  const vote = useWriteAllocation(council);

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
            <h4 className="h-12 text-xl mb-6 text-accent">
              Cast Your Vote ({votedProjects.length} / {maxVotedProjects}{" "}
              projects)
            </h4>
            {projects.map((project) => {
              const voteCount = votes[project.grantee] || 0;
              return (
                <div
                  key={project.grantee}
                  className="flex items-center justify-between mb-3"
                >
                  <span className="flex-grow">{project.name}</span>
                  <div className="flex items-center">
                    <Button
                      disabled={voteCount <= 0}
                      onClick={() => handleVote(project.grantee, voteCount - 1)}
                      className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-r-none"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={voteCount}
                      onChange={(e) =>
                        handleVote(
                          project.grantee,
                          Number.parseInt(e.target.value),
                        )
                      }
                      className="w-16 bg-gray-600 text-center text-white rounded-none px-3 py-1 input-number-hide-arrows border-none"
                    />
                    <Button
                      disabled={
                        votedProjects.length >= maxVotedProjects &&
                        !votes[project.grantee]
                      }
                      onClick={() => handleVote(project.grantee, voteCount + 1)}
                      className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-l-none"
                    >
                      +
                    </Button>
                    <span className="w-12 text-right">
                      {totalVotes > 0
                        ? Math.round((voteCount / totalVotes) * 100)
                        : 0}
                      %
                    </span>
                  </div>
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

function SkeletonVote() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="h-12">
        <Skeleton className="w-3/5 h-5" />
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
