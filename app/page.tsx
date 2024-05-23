'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CreateMeetingModal from './components/CreateMeetingModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface Meeting {
  _id: string;
  creator: string;
  meetingId: string;
  participant: Participant;
  createdAt: string; // Varsayılan olarak bir tarih metni, isteğe bağlı olarak Date türü de kullanılabilir
}

interface Participant {
  _id: string;
  email: string;
  fullName: string;
}

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const router = useRouter();

  useEffect(() => {
    // localStorage'dan token'ı al
    const token = localStorage.getItem('token');
    
    // Eğer token yoksa veya expired olduysa, login sayfasına yönlendir
    if (!token) {
      window.location.href = '/login';
      return;
    }

     // Backend'den kullanıcının katıldığı toplantı verilerini almak için istek yap
     const fetchMeetings = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/meeting`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMeetings(res.data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        // add 2 seconds delay
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        // setIsLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchMeetings();   
  }, []);

  const handleCreateMeeting = async (meetingId : string, participant: string ) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/meeting/create`, {
        meetingId,
        participant,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeetings([...meetings, res.data.meeting]);
    } catch (error: any) {
      const errorMessage = error.response.data.message;
      toast.error(errorMessage, {
        position: "top-left",
        autoClose: 5000, // 5 saniye sonra otomatik olarak kapanır
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      console.error('Error creating meeting:', error);
    }
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleJoin = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  const handleDelete = async (meetingId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/meeting/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeetings(meetings.filter(meeting => meeting._id !== meetingId));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  }


  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-8">My Meetings</h1>
      <button onClick={handleLogout} className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-2xl text-sm px-5 py-2.5 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800">
        Logout
      </button>
      <div className="w-full max-w-3xl">
      <button onClick={openModal} className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-2xl text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 float-right mb-3" type="button">
          Create Meeting
        </button>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Meeting ID</th>
                <th className="border border-gray-300 px-4 py-2">Participants</th>
                <th className="border border-gray-300 px-4 py-2">Created At</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(meeting => (
                <tr key={meeting._id}>
                  <td className="border border-gray-300 px-4 py-2">{meeting.meetingId}</td>
                  <td className="border border-gray-300 px-4 py-2">{meeting.participant.fullName}</td>
                  <td className="border border-gray-300 px-4 py-2">{new Date(meeting.createdAt).toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button onClick={() => handleJoin(meeting._id)} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-2xl text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ml-10" type="button">Join</button>
                    <button onClick={() => handleDelete(meeting._id)} className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-2xl text-sm px-5 py-2.5 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800 ml-5" type="button">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <CreateMeetingModal showModal={showModal} closeModal={closeModal} onSubmit={handleCreateMeeting} />
      <ToastContainer />
    </main>
  );
}
