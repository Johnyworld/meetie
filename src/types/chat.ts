import { BaseDocument } from './index';

export interface ChatMessage extends Omit<BaseDocument, 'updated_at'> {
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
}
