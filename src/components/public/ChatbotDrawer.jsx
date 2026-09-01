import React from 'react';
import { ConciergeWindow } from '../chatbot/ConciergeWindow';

export const ChatbotDrawer = ({ isOpen, onClose }) => {
  return <ConciergeWindow isOpen={isOpen} onClose={onClose} />;
};

export default ChatbotDrawer;
