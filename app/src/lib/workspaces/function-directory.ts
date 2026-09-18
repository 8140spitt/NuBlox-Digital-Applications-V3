import activitySource from '$lib/generated/enterprise-activity-source.json';
import { enterpriseFunctions } from '$lib/enterprise/functions';
import {
  activityObjectActionMappings,
  type ActivityObjectActionMapping
} from '$lib/data/activity-object-action-mapping';

const mappingsBySubfunction = new Map<string, ActivityObjectActionMapping[]>();
for (const mapping of activityObjectActionMappings) {
  const entries = mappingsBySubfunction.get(mapping.subfunctionId) ?? [];
  entries.push(mapping);
  mappingsBySubfunction.set(mapping.subfunctionId, entries);
}

export function getFunctionWorkspace(functionId: string) {
  const canonicalId = functionId.trim().toUpperCase();
  const definition = enterpriseFunctions.find((entry) => entry.id === canonicalId);
  if (!definition) return null;

  const subfunctions = activitySource.subfunctions
    .filter((entry) => entry.functionId === canonicalId)
    .map((entry) => {
      const mappings = mappingsBySubfunction.get(entry.id) ?? [];
      const aggregates = [
        ...new Map(
          mappings.map((mapping) => [
            mapping.aggregateId,
            { id: mapping.aggregateId, rootName: mapping.aggregateRootName }
          ])
        ).values()
      ];
      const objects = [...new Set(mappings.map((mapping) => mapping.objectName))].sort();

      return {
        id: entry.id,
        name: entry.name,
        sourceName: entry.sourceName,
        activityCount: entry.activities.length,
        aggregates,
        objects,
        activities: mappings.map((mapping) => ({
          id: mapping.activityId,
          name: mapping.activityName,
          action: mapping.action,
          accessMode: mapping.accessMode,
          aggregateId: mapping.aggregateId,
          aggregateRootName: mapping.aggregateRootName,
          objectModelId: mapping.objectModelId,
          objectName: mapping.objectName,
          approvalRequired: mapping.approvalRequired,
          decisionRequired: mapping.decisionRequired,
          evidenceRequired: mapping.evidenceRequired,
          writeAuthority: mapping.writeAuthority
        }))
      };
    });

  const activities = subfunctions.flatMap((entry) => entry.activities);
  const aggregates = [
    ...new Map(
      activities.map((activity) => [
        activity.aggregateId,
        { id: activity.aggregateId, rootName: activity.aggregateRootName }
      ])
    ).values()
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    id: definition.id,
    name: definition.name,
    shortName: definition.shortName,
    implementationState: definition.state,
    subfunctions,
    aggregates,
    summary: {
      subfunctionCount: subfunctions.length,
      activityCount: activities.length,
      aggregateCount: aggregates.length,
      commandCount: activities.filter((activity) => activity.accessMode === 'command').length,
      queryCount: activities.filter((activity) => activity.accessMode === 'query').length,
      approvalControlledCount: activities.filter((activity) => activity.approvalRequired).length,
      decisionControlledCount: activities.filter((activity) => activity.decisionRequired).length
    }
  };
}

export const functionWorkspaceDirectory = enterpriseFunctions.map((entry) => {
  const workspace = getFunctionWorkspace(entry.id);
  if (!workspace) throw new Error('Missing function workspace for ' + entry.id);
  return workspace;
});
