'use client'

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import '../styles/video-component.css';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { useSocket } from '../components/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NewWindow from 'react-new-window'
import { faMicrophoneSlash, faMicrophone, faVideo, faVideoSlash, faComments, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

const iceServers = [
  {
    "urls": "stun:193.16.148.245:3478"
  }
];

interface Meeting {
  _id: string;
  creator: Participant,
  meetingId: string;
  participant: Participant;
  createdAt: string;
}

interface Participant {
  _id: string;
  email: string;
  fullName: string;
}

interface VideoComponentProps {
  meetingId: string;
  meeting: Meeting;
  toggleChat: () => void;
}

const VideoComponent = ({ meetingId, meeting, toggleChat }: VideoComponentProps) => {
  const router = useRouter();
  const { socket } = useSocket();
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);
  const partnerScreenShareVideo = useRef<HTMLVideoElement | null>(null);
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [idToCall, setIdToCall] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPartnerScreenSharing, setIsPartnerScreenSharing] = useState(false);

  const host = process.env.NEXT_PUBLIC_PEER_SERVER || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 9000;
  const userId = localStorage.getItem('userId');

  const generateRandomString = () => Math.random().toString(36).substring(2);
   
  useEffect(() => {
    setMyUniqueId(generateRandomString());
  }, []);

  useEffect(() => {
    if (myUniqueId) {
      let peer: Peer;
      if (typeof window !== 'undefined') {
        peer = new Peer(myUniqueId, {
          host: host,
          port: port,
          path: '/myapp',
          secure: true,
          debug: 0,
          config: {
            iceServers: iceServers
          },
        });

        peer.on('open', id => {
          console.log('My peer ID is: %s at %s', id, new Date().toISOString());
          setPeerInstance(peer);
          socket.emit('joinMeeting', { meetingId, peerId: id });
        });

        peer.on('error', error => {
          console.error('PeerJS error:', error);
        });

        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        }).then(stream => {
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }

          peer.on('call', call => {
            call.answer(stream);
            call.on('stream', userVideoStream => {
              // setPartnerConnected(true);
              if (partnerVideo.current) {
                partnerVideo.current.srcObject = userVideoStream;
              }

            });

            setPeerConnection(call.peerConnection);

            call.on('close', () => {
              // setPartnerConnected(false);
            });
          });
        }).catch(error => {
          console.error('Failed to get local stream:', error);
        });

      }
      return () => {
        if (peer) {
          peer.destroy();
        }
      };
    }
  }, [myUniqueId, socket]);

  useEffect(() => {
    if (peerInstance) {
      socket.on('userJoined', ({ peerId }) => {
        console.log('User joined with id: ', peerId);
        setIdToCall(peerId);
        callPartner(peerId);
      });

      socket.on('userLeft', ({ peerId }) => {
        console.log('User left with id: ', peerId);
        if (peerId === idToCall) {
          // setPartnerConnected(false);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = null;
          }
        }
      });

      return () => {
        socket.off('userJoined');
        socket.off('userLeft');
      };
    }
  }, [peerInstance, socket, idToCall]);

  const callPartner = (peerId: any) => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    }).then(stream => {
      const call = peerInstance?.call(peerId, stream);
      if (call) {
        call.on('stream', userVideoStream => {
          // setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = userVideoStream;
          }
        });

        call.on('close', () => {
          // setPartnerConnected(false);
        });
        
        setPeerConnection(call.peerConnection);
      }
    });
  };

  const leaveChat = () => {
    if (peerInstance) {
      peerInstance.destroy();
      setPeerInstance(null);
    }
    socket.emit('leaveMeeting', { meetingId, peerId: myUniqueId });
    router.push('/'); // Redirect to the main page
  };

  const toggleMute = () => {
    toggleMediaStream('audio', isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    toggleMediaStream('video', isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const toggleMediaStream = (type: 'audio' | 'video', state: boolean) => {
    const stream = userVideo.current?.srcObject as MediaStream;
    stream.getTracks().filter(track => track.kind === type).forEach(track => track.enabled = state);
    const videoSender = peerConnection?.getSenders().find(sender => sender.track?.kind === type);
    if (videoSender) {
      videoSender.track!.enabled = state;
    }
  }

  const shareScreen = async () => {
    // @ts-ignore
  };
  
  const stopScreenShare = () => {
    // @ts-ignore
  };


  return (
    <div className="video-container">
      <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
        <video ref={userVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">
          Me
        </div>
        <div className="video-control absolute top-0 right-0 m-2 flex flex-col gap-2">
          <button onClick={toggleMute} className="video-mute-button px-2 py-1 bg-white text-black rounded flex items-center">
            <FontAwesomeIcon icon={isMuted ? faMicrophone : faMicrophoneSlash} />
          </button>
          <button onClick={toggleVideo} className="video-camera-button px-2 py-1 bg-white text-black rounded flex items-center">
            <FontAwesomeIcon icon={isVideoOff ? faVideo : faVideoSlash} />
          </button>
          <button onClick={toggleChat} className="bg-white text-black p-2 rounded">
              <FontAwesomeIcon icon={faComments} />
          </button>
          <button onClick={shareScreen} className="bg-gray-800 text-white p-2 rounded">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> 
          </button>
        </div>
      </div>
      <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
        <video ref={partnerVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">
          {meeting.participant._id === userId ? meeting.creator.fullName : meeting.participant.fullName}
        </div>
      </div>
      <button onClick={leaveChat} className="leave-button mt-4 px-4 py-2 bg-red-500 text-white rounded">Leave Chat</button>
      {isPartnerScreenSharing &&
        <NewWindow features={{ width: 500, height: 500 }} title="Partner Screen Share">
          <video ref={partnerScreenShareVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        </NewWindow>}
    </div>
    
  );
};

export default VideoComponent;
