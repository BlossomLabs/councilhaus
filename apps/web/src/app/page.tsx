import { Button } from "@repo/ui/components/ui/button";
import VotingCard from "../components/VotingCard";

async function getProjects() {
  return ["Project 1", "Project 2", "Project 3", "Project 4"];
}

export default async function Page() {
  const projects = await getProjects();
  return (
    <main>
      <h1 className="text-4xl font-bold mb-4 text-accent">Frontier Guild</h1>
      <VotingCard className="max-w-lg mx-auto" projects={projects} maxVotedProjects={3} />
    </main>
  );
}
