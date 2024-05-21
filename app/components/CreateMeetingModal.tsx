import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Props {
  showModal: boolean;
  closeModal: () => void;
  onSubmit: (meetingId: string, participant: string) => void;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
}

const CreateMeetingModal: React.FC<Props> = ({ showModal, closeModal, onSubmit }) => {
  const [meetingId, setMeetingId] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get<User[]>(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUsers(res.data);
        setSelectedParticipant(res.data[0]._id);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (showModal) {
      fetchUsers();
    }
  }, [showModal]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(meetingId, selectedParticipant);
    setMeetingId('');
    setSelectedParticipant('');
    closeModal();
  };

  const handleParticipantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.value;
    setSelectedParticipant(selectedOption);
  };

  return (
    <div id="create-meeting-modal" tabIndex={-1} aria-hidden={!showModal} className={`fixed top-0 right-0 left-0 z-50 flex justify-center items-center h-full bg-gray-800 bg-opacity-50 ${showModal ? '' : 'hidden'}`}>
      <div className="relative p-4 w-full max-w-md">
        <div className="relative bg-gray-900 rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Create New Meeting</h3>
            <button type="button" onClick={closeModal} className="text-gray-400 bg-transparent hover:bg-gray-600 hover:text-white rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-700">
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <form onSubmit={handleFormSubmit} className="p-4 bg-gray-700">
            <div className="mb-4">
              <label htmlFor="meetingId" className="block mb-2 text-sm font-medium text-white">Meeting ID</label>
              <input type="text" name="meetingId" id="meetingId" value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="Enter meeting ID" required />
            </div>
            <div className="mb-4">
              <label htmlFor="participants" className="block mb-2 text-sm font-medium text-white">Participant</label>
              <select name="participants" id="participants" value={selectedParticipant} onChange={handleParticipantChange} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.fullName}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5">Add new meeting</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
