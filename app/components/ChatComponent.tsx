import React, { useState, useRef, useEffect } from 'react';
import '../styles/chat-component.css';
import { useSocket } from '../components/SocketContext';

interface ChatComponentProps {
  meetingId: string;
  isChatOpen: boolean;
  toggleChat: () => void;
}

interface Message {
  text: string;
  sender: string;
  time: string;
}

const ChatComponent = ({ isChatOpen, toggleChat, meetingId }: ChatComponentProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();
  const senderId = localStorage.getItem('userId') as string;

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      socket.emit('chatMessage', { meetingId, sender: senderId, message: newMessage });
      setNewMessage('');
    }
  };

  useEffect(() => {
    socket.on('newChatMessage', ({ meetingId, sender, message }) => {
      if (meetingId !== meetingId) return;
      setMessages([...messages, { text: message, sender, time: new Date().toLocaleTimeString() }]);
    });

    return () => {
      socket.off('newChatMessage');
    };
  }, [socket, messages]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        toggleChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatOpen, toggleChat]);

  return (
    <div className={`chat-container fixed top-0 right-0 h-full w-1/3 bg-white shadow-lg ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
      <div className="chat-header bg-blue-500 text-white p-4 flex justify-between items-center">
        <span>Chat</span>
        <button onClick={toggleChat} className="close-chat text-white">
          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6"/> </svg> 
        </button>
      </div>
      <div ref={chatBodyRef} className="chat-body p-4 overflow-y-auto flex-grow">
        {messages.map((message, index) => (
          <div key={index} className={`chat-message mb-2 p-2 rounded ${message.sender === senderId ? 'bg-indigo-600 text-white self-end' : 'bg-gray-100 text-gray-900 self-start'}`}>
            <div className="text-sm font-normal leading-snug">{message.text}</div>
            <div className="text-xs text-gray-500 text-right">{message.time}</div>
          </div>
        ))}
      </div>
      <div className="chat-footer p-4 flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded mr-2"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} className="bg-blue-500 text-white rounded px-4 py-2">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;
