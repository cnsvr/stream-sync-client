import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import '../styles/video-component.css';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

interface Meeting {
  _id: string;
  creator: string,
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
  const [isMyVideoOn, setIsMyVideoOn] = useState<boolean>(true);
  const [isMyAudioOn, setIsMyAudioOn] = useState<boolean>(true);
  const [isPartnerVideoOn, setIsPartnerVideoOn] = useState<boolean>(true);
  const [isPartnerAudioOn, setIsPartnerAudioOn] = useState<boolean>(true);
  const host = process.env.NEXT_PUBLIC_PEER_SERVER || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 9000;

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'unknownUser';
    const peerId = `${meetingId}-${userId}`;

    // PeerJS sunucusuna bağlan
    peer.current = new Peer(peerId, {
      host: host,
      port: port,
      secure: true,
      path: '/myapp',
    });

    peer.current.on('open', id => {
      console.log('My peer ID is: ' + id);
      socket.emit('joinMeeting', { meetingId, peerId: id });
    });

    // Yerel video akışını al
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      if (!peer.current) {
        console.error('PeerJS sunucusuna bağlanılamadı.');
        return;
      }

      // Gelen aramaları cevapla
      peer.current.on('call', call => {
        call.answer(stream);
        call.on('stream', remoteStream => {
          console.log('Stream received on call:', remoteStream);
          setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
          }
        });

        call.on('close', () => {
          setPartnerConnected(false);
        });
      });
      socket.on('userJoined', ({ peerId }) => {
        console.log('User joined:', peerId);
        const call = peer.current?.call(peerId, stream);
        call?.on('stream', remoteStream => {
          console.log('Stream received on userJoined:', remoteStream);
          setPartnerConnected(true);
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
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

  return (
    <div>
      <div className="video-container">
        <video ref={userVideo} autoPlay playsInline />
        {partnerConnected ? (
          <video ref={partnerVideo} autoPlay playsInline />
        ) : (
          <div className="not-connected">Guest is not available</div>
        )}
      </div>
    </div>
  );
};

export default VideoComponent;
