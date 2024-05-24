'use client'

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
  const [peer, setPeer] = useState<Peer | null>(null);
  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [idToCall, setIdToCall] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);

  const host = process.env.NEXT_PUBLIC_PEER_SERVER || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT) || 9000;

  const generateRandomString = () => Math.random().toString(36).substring(2);

  useEffect(() => {
    setMyUniqueId(generateRandomString());
  }, []);

  useEffect(() => {
    if(myUniqueId){
        let peer: Peer;
        if (typeof window !== 'undefined') {
          peer = new Peer(myUniqueId, {
            host: host,
            port: port,
            path: '/myapp',
            secure: true,
            debug: 3,
          });

          setPeer(peer);

          peer.on('open', id => {
            console.log('My peer ID is: ' + id);
            socket.emit('joinMeeting', { meetingId, peerId: id });
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
                if (partnerVideo.current) {
                  setPartnerConnected(true);
                  partnerVideo.current.srcObject = userVideoStream;
                }
              });

              call.on('close', () => {
                setPartnerConnected(false);
              });
            });
          });

          socket.on('userJoined', ({ peerId }) => {
            setIdToCall(peerId);
            callPartner();
          });
        }
        return () => {
            if (peer) {
              peer.destroy();
            }
          };
    }
  }, [myUniqueId]);

  const callPartner = () => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    }).then(stream => {
      const call = peer?.call(idToCall, stream);
      if (call) {
        call.on('stream', userVideoStream => {
          if (partnerVideo.current) {
            setPartnerConnected(true);
            partnerVideo.current.srcObject = userVideoStream;
          }
        });

        call.on('close', () => {
          setPartnerConnected(false);
        });
      }
    });
  };

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