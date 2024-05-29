'use client'

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import '../styles/video-component.css';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { useSocket } from '../components/SocketContext'; // Socket Context'ten useSocket hook'unu içe aktarın

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
}

const VideoComponent = ({ meetingId, meeting }: VideoComponentProps) => {
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [idToCall, setIdToCall] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const router = useRouter(); // Initialize router for navigation
  const { socket } = useSocket(); // Socket instance'ını context'ten alın

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
          debug: 3,
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
            console.log('Setting user video stream at %s', new Date().toISOString());
            userVideo.current.srcObject = stream;
          }

          peer.on('call', call => {
            call.answer(stream);
            call.on('stream', userVideoStream => {
              setPartnerConnected(true);
              if (partnerVideo.current) {
                partnerVideo.current.srcObject = userVideoStream;
              }
            });

            call.on('close', () => {
              setPartnerConnected(false);
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
          setPartnerConnected(false);
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
      console.log('Calling partner with id: %s at %s', peerId, new Date().toISOString());
      const call = peerInstance?.call(peerId, stream);
      if (call) {
        call.on('stream', userVideoStream => {
          setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = userVideoStream;
          }
        });

        call.on('close', () => {
          setPartnerConnected(false);
        });

        console.log('peer connection: ', call.peerConnection);

        call.peerConnection.oniceconnectionstatechange = () => {
          // date with milliseconds
          console.log('ICE connection state: %s at %s', call.peerConnection.iceConnectionState, new Date().toISOString());
          if (call.peerConnection.iceConnectionState === 'disconnected') {
            console.log('Disconnected and setting partner connected to false');
            setPartnerConnected(false);
          }
        };
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

  return (
    <div className="video-container flex justify-center items-center gap-4 flex-wrap max-h-screen overflow-hidden">
      <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
        <video ref={userVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">{meeting.creator._id === userId ? meeting.creator.fullName : meeting.participant.fullName}</div>
      </div>
      
      <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
        <video ref={partnerVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">{meeting.participant._id === userId ? meeting.creator.fullName : meeting.participant.fullName}</div>
      </div>
     
      <button onClick={leaveChat} className="leave-button mt-4 px-4 py-2 bg-red-500 text-white rounded">Leave Chat</button>
    </div>
  );
};

export default VideoComponent;
