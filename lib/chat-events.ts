// Chat Event System - allows triggering chat from anywhere in the app

export interface StartConversationParams {
    type: 'COMMERCE' | 'PAWMATCH' | 'SUPPORT';
    participantId: string;
    contextId?: string;
    metadata?: {
        title?: string;
        image?: string;
    };
}

type ChatEventListener = (params: StartConversationParams) => void;

class ChatEventEmitter {
    private listeners: ChatEventListener[] = [];

    subscribe(listener: ChatEventListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(params: StartConversationParams) {
        this.listeners.forEach(listener => listener(params));
    }
}

export const chatEvents = new ChatEventEmitter();

// Helper function to start a conversation from anywhere
export function startConversation(params: StartConversationParams) {
    chatEvents.emit(params);
}
