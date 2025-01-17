import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Context from './Context';
import Peer from 'simple-peer';

const URL = 'https://apinc.herokuapp.com/';
export const socket = io(URL);

interface IState {
  children: any;
}

export const State: React.FC<IState> = ({ children }) => {
  const [onlineList, setOnlineList] = useState([]);
  const [receiveCall, setReceiveCall] = useState(false);
  const [otherUser, setOtherUser] = useState('');
  const [signalCall, setSignalCall] = useState({});
  const [video, setVideo] = useState({});
  const [isCall, setIsCall] = useState(false);
  const [myMic, setMyMic] = useState(false);
  const [myVid, setMyVid] = useState(true);
  const [yourMic, setYourMic] = useState(false);
  const [yourVid, setYourVid] = useState(true);
  const [callSuccess, setCallSuccess] = useState(false);
  const [screenShare, setScreenShare] = useState(false);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  const screenShareTrack = useRef(null);

  useEffect(() => {
    myVideo.current = {};
  }, []);

  useEffect(() => {
    socket.on('online', (list: any) => {
      for (let t of list) if (t.id === socket.id) list.splice(list.indexOf(t), 1);
      setOnlineList(list);
    });
    socket.emit('online');
    socket.on('callToUser', (from: any) => {
      if (!callSuccess) {
        setReceiveCall(true);
        setOtherUser(from);
      } else socket.emit('callFail', { from: from });
    });

    socket.on('callFail', () => {
      alert('Teacher is calling with other student');
      window.location.href = '/';
    });
    socket.on('endCall', () => {
      if (callSuccess || isCall) window.location.href = '/';
      else setReceiveCall(false);
    });

    socket.on('iCallUser', (signal: any) => {
      setSignalCall(signal);
    });

    socket.on('updateVideo', (from: any, vid: any, mic: any) => {
      if (from === otherUser) {
        setYourMic(mic);
        setYourVid(vid);
      }
    });
  });

  const callUser = async (id: any) => {
    setOtherUser(id);
    setIsCall(true);
    socket.emit('callToUser', { from: socket.id, to: id });
  };

  const iCall1 = () => {
    if (onlineList.length < 2) alert('Cuộc gọi thất bại');
    else {
      let id = '';
      for (let t of onlineList) id = t;
      setOtherUser(id);
      setIsCall(true);
      socket.emit('callToUser', ({from: socket.id, to: id}));
    };

    const iCall1 = () =>{
      if (onlineList.length < 2)
        alert('Cuộc gọi thất bại')
      else{
        let id = '';
        for (let t of onlineList)
        if (t!= socket.id)
          id = t;
        if (id === ''){
          alert('Cuộc gọi thất bại')
          return;
        }
        setOtherUser(id);
        setIsCall(true);
        socket.emit('callToUser', ({from: socket.id, to: id}));
        window.location.href = '/call';
      }
    };


  const iCall = () => {
    try {
      const stream = myVideo.current.srcObject;
      const peer = new Peer({ initiator: true, trickle: false, stream });
      peer.on('signal', (data: any) => {
        socket.emit('iCallUser', {
          userToCall: otherUser,
          signalData: data,
          from: socket.id,
          name: socket.id,
        });
      });

      peer.on('stream', (currentStream: any) => {
        userVideo.current.srcObject = currentStream;
        console.log('stream');
      });

      socket.on('iCallUser', (signal: any) => {
        peer.signal(signal);
        setCallSuccess(true);
        //console.log(19);
      });

      connectionRef.current = peer;
      console.log(connectionRef.current);
    } catch (e) {
      window.location.href = '/';
    }
  };
  const decline = () => {
    socket.emit('decline', { to: otherUser });
  };

  const acceptCall = (id: any) => {
    const stream = myVideo.current.srcObject;
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', (data: any) => {
      socket.emit('iCallUser', {
        userToCall: otherUser,
        signalData: data,
        from: socket.id,
        name: socket.id,
      });
    });

    peer.on('stream', (currentStream: any) => {
      userVideo.current.srcObject = currentStream;
    });

    setCallSuccess(true);
    peer.signal(signalCall);

    connectionRef.current = peer;
    console.log(connectionRef.current);
  };

  const setMicroStatus = () => {
    socket.emit('updateVideo', { from: socket.id, to: otherUser, vid: myVid, mic: !myMic });
    setMyMic(!myMic);
  };

  const setVideoStatus = () => {
    socket.emit('updateVideo', { from: socket.id, to: otherUser, vid: !myVid, mic: myMic });
    setMyVid(!myVid);
  };

  const leaveCall = () => {
    socket.emit('leaveCall', { from: socket.id, to: otherUser });
    //window.location.href = '/';
  };

  const handleScreenSharing = () => {
    if (!myVid) {
      alert('Please turn on your video');
      return;
    }

    if (screenShare) {
      /*    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true, cursor: false })
      .then((currentStream) => {
        const stream = myVideo.current.srcObject;
        myVideo.current.srcObject = currentStream;
        const screenTrack = currentStream.getTracks()[0];
        connectionRef.current.replaceTrack(
          connectionRef.current.streams[0]
            .getTracks()
            .find((track) => track.kind === 'video'),
            currentStream,
          stream
        );
      })*/
      screenShareTrack.current.onended();
    } else {
      const opts = { cursor: true };
      const mediaDevices = navigator.mediaDevices as any;
      mediaDevices
        .getDisplayMedia(opts)
        //navigator.mediaDevices.getDisplayMedia(opts)
        .then((currentStream: any) => {
          const stream = myVideo.current.srcObject;
          myVideo.current.srcObject = currentStream;
          const screenTrack = currentStream.getTracks()[0];
          connectionRef.current.replaceTrack(
            connectionRef.current.streams[0]
              .getTracks()
              .find((track: any) => track.kind === 'video'),
            screenTrack,
            stream,
          );

          screenTrack.onended = () => {
            connectionRef.current.replaceTrack(
              screenTrack,
              connectionRef.current.streams[0]
                .getTracks()
                .find((track: any) => track.kind === 'video'),
              stream,
            );

            myVideo.current.srcObject = stream;
            setScreenShare(false);
          };
          screenShareTrack.current = screenTrack;
        })
        .catch((error: any) => {
          console.log('No stream for sharing');
        });
    }
    setScreenShare(!screenShare);
  };

  return (
    <Context.Provider
      value={{
        onlineList,
        receiveCall,
        otherUser,
        acceptCall,
        setReceiveCall,
        decline,
        callUser,
        myVideo,
        userVideo,
        leaveCall,
        setVideo,
        iCall,
        isCall,
        video,
        yourMic,
        myMic,
        yourVid,
        myVid,
        callSuccess,
        setVideoStatus,
        setMicroStatus,
        handleScreenSharing,
        screenShare,
        iCall1,
      }}
    >
      {children}
    </Context.Provider>
  );
};

//export default State;
