import { ProviderDisabledError } from '../errors.js';
import type {
  AiProvider,
  BusinessContext,
  BusinessSummary,
  WebsiteGenerationInput,
  WebsiteContent,
  OutreachGenerationInput,
  OutreachMessageResult,
  ContentReviewInput,
  ContentReviewResult,
  ChatReplyInput,
  ChatReplyResult,
} from './types.js';

/** Provider de IA desabilitado — recusa qualquer geração. */
export class DisabledAiProvider implements AiProvider {
  public readonly name = 'disabled';

  generateBusinessSummary(_input: BusinessContext): Promise<BusinessSummary> {
    return Promise.reject(new ProviderDisabledError('ai'));
  }
  generateWebsiteContent(_input: WebsiteGenerationInput): Promise<WebsiteContent> {
    return Promise.reject(new ProviderDisabledError('ai'));
  }
  generateOutreachMessage(_input: OutreachGenerationInput): Promise<OutreachMessageResult> {
    return Promise.reject(new ProviderDisabledError('ai'));
  }
  reviewGeneratedContent(_input: ContentReviewInput): Promise<ContentReviewResult> {
    return Promise.reject(new ProviderDisabledError('ai'));
  }
  generateChatReply(_input: ChatReplyInput): Promise<ChatReplyResult> {
    return Promise.reject(new ProviderDisabledError('ai'));
  }
}
