/**
 * AI service and integration type definitions
 */

export interface AIRequirementBreakdown {
	/** Generated tasks from the requirement */
	tasks: TaskItem[];
	/** Summary of what was created */
	summary: string;
	/** Original requirement text */
	originalRequirement: string;
	/** Processing metadata */
	metadata: {
		processingTime: number;
		model: string;
		timestamp: Date;
	};
}

export interface AIOptimizationResult {
	/** Optimized story text */
	optimizedStory: string;
	/** Original story text */
	originalStory: string;
	/** Explanation of changes made */
	changes: string[];
	/** Confidence score (0-1) */
	confidence: number;
	/** Processing metadata */
	metadata: {
		processingTime: number;
		model: string;
		timestamp: Date;
	};
}

export interface AIServiceConfig {
	/** API endpoint URL */
	baseUrl: string;
	/** API key for authentication */
	apiKey: string;
	/** Model to use for requests */
	model: string;
	/** Request timeout in milliseconds */
	timeout: number;
	/** Maximum retries for failed requests */
	maxRetries: number;
}

export interface AIRequestOptions {
	/** Temperature for response creativity (0-1) */
	temperature?: number;
	/** Maximum tokens in response */
	maxTokens?: number;
	/** Custom system prompt */
	systemPrompt?: string;
	/** Whether to stream the response */
	stream?: boolean;
}

export type AIOperationStatus = 'idle' | 'processing' | 'success' | 'error';

export interface AIOperationState {
	/** Current operation status */
	status: AIOperationStatus;
	/** Progress percentage (0-100) */
	progress: number;
	/** Current operation message */
	message: string;
	/** Error details if operation failed */
	error: string | null;
	/** Start time of current operation */
	startTime: Date | null;
}

// Import TaskItem for AI operations
import type { TaskItem } from './kanban.js';
