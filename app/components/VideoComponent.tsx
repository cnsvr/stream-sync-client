import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import '../styles/video-component.css';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

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

const VideoComponent = ({ meetingId, meeting } : VideoComponentProps ) => {
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);
  const peer = useRef<Peer | null>(null);
  const [partnerConnected, setPartnerConnected] = useState<boolean>(false);
  const host = process.env.NEXT_PUBLIC_PEER_SERVER || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 9000;

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'unknownUser';
    const peerId = `${meetingId}-${userId}${Math.floor(Math.random() * 1000)}`;

    // Connect to PeerJS server
    peer.current = new Peer(peerId, {
      host: host,
      port: port,
      secure: true,
      path: '/myapp',
      debug: 1
    });

    peer.current.on('open', id => {
      console.log('My peer ID is: ' + id);
      socket.emit('joinMeeting', { meetingId, peerId: id });
    });

    // Get local video stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
        userVideo.current.play();
      }

      if (!peer.current) {
        console.error('Unable to connect to PeerJS server.');
        return;
      }

      peer.current.on('error', error => {
        console.error('PeerJS error:', error);
      });

      // Answer incoming calls
      peer.current.on('call', call => {
        call.answer(stream);
        call.on('stream', remoteStream => {
          console.log('Stream received on call:', remoteStream);
          setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
            partnerVideo.current.play();
          } else {
            console.error('Partner video element is not available.');
          }
        });

        call.on('close', () => {
          setPartnerConnected(false);
        });
      });

      // Handle user joined event
      socket.on('userJoined', ({ peerId }) => {
        console.log('User joined:', peerId);
        const call = peer.current?.call(peerId, stream);
        call?.on('stream', remoteStream => {
          console.log('Stream received on userJoined:', remoteStream);
          setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
            partnerVideo.current.play();
          } else {
            console.error('Partner video element is not available.');
          }
        });

        call?.on('close', () => {
          console.log('User left:', peerId);
          setPartnerConnected(false);
        });
      });
    });

    return () => {
      peer.current?.destroy();
      socket.off('userJoined');
    };
  }, [meetingId]);

  useEffect(() => {
    if (partnerConnected && partnerVideo.current) {
      // Try to play the video element if it is connected and available
      partnerVideo.current.play().catch(error => {
        console.error('Error playing partner video:', error);
      });
    }
  }, [partnerConnected]);

  return (
    <div className="video-container flex justify-center items-center gap-4 flex-wrap max-h-screen overflow-hidden">
      <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
        <video ref={userVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
        <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">{meeting.creator.fullName}</div>
      </div>
      {partnerConnected ? (
        <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
          <video ref={partnerVideo} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
          <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">{meeting.participant.fullName}</div>
        </div>
      ) : (
        <div className="video-wrapper relative w-[calc(50%-1rem)] pt-[50%] bg-black overflow-hidden">
          <div className="not-connected flex justify-center items-center w-full h-full text-white bg-black bg-opacity-80">Guest is not available</div>
          <div className="video-label absolute bottom-0 left-0 w-full text-center bg-black bg-opacity-60 text-white py-2">{meeting.participant.fullName}</div>
        </div>
      )}
    </div>
  );
};

export default VideoComponent;