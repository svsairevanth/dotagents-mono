import { describe, expect, it } from 'vitest';
import type { AgentProgressStep } from '@dotagents/shared';
import { createDelegationProgressMessages } from './delegationProgress';

describe('createDelegationProgressMessages', () => {
  it('keeps the latest update for each delegated run and surfaces status details', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-1-start',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 100,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'running',
          progressMessage: 'Searching sources',
          startTime: 100,
        },
      },
      {
        id: 'delegation-1-done',
        type: 'thinking',
        title: 'Delegating',
        status: 'completed',
        timestamp: 200,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'completed',
          resultSummary: 'Built a 5-step plan',
          startTime: 100,
          endTime: 200,
        },
      },
      {
        id: 'delegation-2-fail',
        type: 'thinking',
        title: 'Delegating',
        status: 'error',
        timestamp: 210,
        delegation: {
          runId: 'run-2',
          agentName: 'Research',
          task: 'Find latest changelog',
          status: 'failed',
          error: 'Timeout',
          startTime: 205,
          endTime: 210,
        },
      },
    ];

    const messages = createDelegationProgressMessages(steps);

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('delegation-run-1');
    expect(messages[0].variant).toBe('delegation');
    expect(messages[0].content).toContain('Delegated to Planner · Completed');
    expect(messages[0].content).toContain('Built a 5-step plan');

    expect(messages[1].content).toContain('Delegated to Research · Failed');
    expect(messages[1].content).toContain('Timeout');
  });
});
