'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import VideoComponent from '../../components/VideoComponent';

interface Meeting {
  _id: string;
  creator: Participant;
  meetingId: string;
  participant: Participant;
  createdAt: string;
}

interface Participant {
  _id: string;
  email: string;
  fullName: string;
}

const MeetingPage = () => {
  const { meetingId } = useParams<any>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!meetingId) return;

    const fetchMeeting = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/meeting/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMeeting(res.data);
      } catch (error) {
        console.error('Error fetching meeting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return <div>Meeting not found</div>;
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-8">Meeting</h1>
      <div className="w-full flex justify-center">
        <div className="max-w-5xl max-h-5xl w-full">
          <VideoComponent meetingId={meetingId as string} meeting={meeting} />
        </div>
      </div>
    </main>
  );
}

export default MeetingPage;