export async function getGrantees(
  council: `0x${string}`,
): Promise<{ name: string; grantee: `0x${string}` }[]> {
  type AddedEvent = {
    name: string;
    grantee: `0x${string}`;
    timestamp_: string;
  };
  type RemovedEvent = {
    grantee: `0x${string}`;
    timestamp_: string;
  };
  // Define the URL and the GraphQL query
  const url =
    "https://api.goldsky.com/api/public/project_cm10r8z66lbri01se6301ddxj/subgraphs/Council/1.0.0/gn";
  const query = `
{
  granteeAddeds {
    name
    grantee
    timestamp_
  }
  granteeRemoveds {
    grantee
    timestamp_
  }
}
`;

  // Set up the request payload
  const payload = {
    query: query,
  };

  // Fetch the data
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      // Extract and merge the events
      const granteeAddeds = data.data.granteeAddeds.map(
        (event: AddedEvent) => ({
          type: "added",
          name: event.name,
          grantee: event.grantee,
          timestamp: Number.parseInt(event.timestamp_, 10),
        }),
      );

      const granteeRemoveds = data.data.granteeRemoveds.map(
        (event: RemovedEvent) => ({
          type: "removed",
          grantee: event.grantee,
          timestamp: Number.parseInt(event.timestamp_, 10),
        }),
      );

      // Combine the events into one list
      const allEvents = [...granteeAddeds, ...granteeRemoveds];

      // Sort the combined list by timestamp
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Reduce the list to get the current state of grantees with their names
      const grantees: Map<
        `0x${string}`,
        { name: string; grantee: `0x${string}` }
      > = allEvents.reduce((acc, event) => {
        if (event.type === "added") {
          acc.set(event.grantee, { name: event.name, grantee: event.grantee });
        } else if (event.type === "removed") {
          acc.delete(event.grantee);
        }
        return acc;
      }, new Map());

      // Convert the Map values to an array of {name, grantee} objects
      const currentGrantees = Array.from(grantees.values());
      return currentGrantees;
    });
}
