import { useCallback } from 'react';
import { validateTransition } from '@/features/workflows/services/workflowExecutionService';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hook to validate workflow transitions before executing them on the board
 */
export function useBoardTransitionValidation() {
  /**
   * Validates if a transition from the current status to the target status is allowed
   */
  const validateBoardTransition = useCallback(
    async (
      issueId: string,
      fromStatusId: string,
      toStatusId: string
    ): Promise<ValidationResult> => {
      // Same status - no transition needed
      if (fromStatusId === toStatusId) {
        return { valid: true };
      }

      try {
        const isValid = await validateTransition(issueId, fromStatusId, toStatusId);
        
        if (!isValid) {
          return {
            valid: false,
            error: 'This transition is not allowed by the workflow',
          };
        }
        
        return { valid: true };
      } catch (error) {
        console.error('Error validating transition:', error);
        return {
          valid: false,
          error: 'Failed to validate workflow transition',
        };
      }
    },
    []
  );

  /**
   * Creates a validator function bound to a specific issue's current status
   */
  const createDropValidator = useCallback(
    (issueStatusMap: Map<string, string>) => {
      return async (issueId: string, targetStatusId: string): Promise<ValidationResult> => {
        const currentStatusId = issueStatusMap.get(issueId);
        
        if (!currentStatusId) {
          return { valid: false, error: 'Issue status not found' };
        }

        return validateBoardTransition(issueId, currentStatusId, targetStatusId);
      };
    },
    [validateBoardTransition]
  );

  return {
    validateBoardTransition,
    createDropValidator,
  };
}
