import React, { useEffect, useRef } from 'react';
import Peer from 'peerjs';

interface VideoComponentProps {
  meetingId: string;
}

const VideoComponent = ({ meetingId } : VideoComponentProps ) => {
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);
  const peer = useRef<Peer | null>(null);
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
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = remoteStream;
          }
        });
      });

      // Toplantıya katıldığında diğer kullanıcıya bağlan
      const call = peer.current.call(`${meetingId}-otherUser`, stream);
      call.on('stream', remoteStream => {
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = remoteStream;
        }
      });
    });

    return () => {
      peer.current?.destroy();
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
