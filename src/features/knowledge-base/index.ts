/**
 * Knowledge Base Feature Module
 * Confluence-like documentation and knowledge management
 */

// Types
export * from './types';

// Services
export * from './services/knowledgeBaseService';

// Hooks
export * from './hooks/useKnowledgeBase';

// Components
export { SpacesList } from './components/SpacesList';
export { KnowledgeBasePage } from './components/KnowledgeBasePage';

// Editor Components
export { 
  PageEditor, 
  EditableBlock, 
  ContentBlockRenderer, 
  SlashCommandMenu,
  slashCommands,
} from './components/editor';
