import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
  transports: ['websocket'],
  upgrade: false
});

socket.on('connect', () => {
  console.log('Connected to websocket server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from websocket server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

interface VideoComponentProps {
  meetingId: string;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ meetingId }) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'unknownUser';
    
    socket.emit('joinMeeting', { meetingId, userId });

    socket.on('userJoined', ({ userId }) => {
      console.log(`User ${userId} joined`);
      initiatePeer(false);
    });

    socket.on('receiveVideo', (data) => {
      if (peer) {
        peer.signal(data);
      } else {
        initiatePeer(true, data);
      }
    });

    socket.on('userDisconnected', ({ userId }) => {
      console.log(`User ${userId} disconnected`);
    });

    return () => {
      console.log('Disconnecting from websocket server');
      socket.disconnect();
    };
  }, [meetingId]);

  const initiatePeer = (initiator = true, signalData = null) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      const newPeer = new SimplePeer({
        initiator,
        trickle: false,
        stream: stream,
      });

      newPeer.on('signal', (data) => {
        socket.emit('sendVideo', data);
      });

      newPeer.on('stream', (stream) => {
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = stream;
        }
      });

      if (signalData) {
        newPeer.signal(signalData);
      }

      setPeer(newPeer);
    }).catch((err) => {
      console.error('Error accessing media devices.', err);
    });
  };

  return (
    <div>
      <video ref={userVideo} autoPlay playsInline />
      <video ref={partnerVideo} autoPlay playsInline />
    </div>
  );
};

export default VideoComponent;
