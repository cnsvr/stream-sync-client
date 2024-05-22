import React, { useEffect, useRef } from 'react';
import Peer from 'peerjs';

const VideoComponent = ({ meetingId }) => {
  const userVideo = useRef(null);
  const partnerVideo = useRef(null);
  const peer = useRef<Peer | null>(null);
  const host = process.env.NEXT_PUBLIC_PEER_SERVER || window.location.hostname;
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 9000;

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'unknownUser';
    const peerId = `${meetingId}-${userId}`;

    // PeerJS sunucusuna bağlan
    peer.current = new Peer(peerId, {
      host: host, // Sunucunuzun çalıştığı IP adresi
      port: port, // Sunucunuzun çalıştığı port
      path: '/peerjs'
    });

    peer.current.on('open', id => {
      console.log('My peer ID is: ' + id);
    });

    // Yerel video akışını al
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      // Gelen aramaları cevapla
      peer.current.on('call', call => {
        call.answer(stream);
        call.on('stream', remoteStream => {
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
          }
        });
      });

      // Toplantıya katıldığında diğer kullanıcıya bağlan
      socket.emit('joinMeeting', { meetingId, userId });

      socket.on('userJoined', ({ userId }) => {
        const call = peer.current.call(`${meetingId}-${userId}`, stream);
        call.on('stream', remoteStream => {
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
          }
        });
      });
    });

    return () => {
      peer.current.destroy();
    };
  }, [meetingId]);

  return (
    <div>
      <video ref={userVideo} autoPlay playsInline />
      <video ref={partnerVideo} autoPlay playsInline />
    </div>
  );
};

export default VideoComponent;
