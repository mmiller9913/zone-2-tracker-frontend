import './App.css';
import React, { useEffect, useState, useRef } from "react";
import Axios from 'axios';
import { signInWithGoogle } from './Firebase';
import icon from './assets/dropdown-icon.png';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactDom from "react-dom";

//when deployed on heroku
export const apiUrl = 'https://zone-2-tracker.herokuapp.com';
//in dev
// export const apiUrl = 'http://localhost:5000';

const App = () => {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [weeklyZone2Minutes, setWeeklyZone2Minutes] = useState('');
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [minutesToLog, setMinutesToLog] = useState(40);
  const [displayDeleteSessionModal, setDisplayDeleteSessionModal] = useState(false);
  const [displaySignInModal, setDisplaySignInModal] = useState(false);
  const [idOfRowInDatabaseToDelete, setIdOfRowInDatabaseToDelete] = useState(null);
  const [isLoggingMinutes, setIsLoggingMinutes] = useState(false);

  const logMinutes = async (minutes) => {
    console.log('Logging minutes...')
    //if not signed in, need to sign in
    if (!currentAccount) {
      console.log('Need to be signed in to log minutes. Opening sign in modal...')
      setDisplaySignInModal(true);
      return;
    }
    console.log('Entering a row in the database');
    Axios.post(`${apiUrl}/api/logminutes`,
      {
        account: currentAccount,
        minutes: minutes,
      }
    ).then(async (results) => {
      //if successfully added to database, display success toast 
      if (results.statusText === 'OK') {
        toast.success("Minutes logged!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        //update weeklyZone2Minutes
        let weeklyZone2Minutes = (await Axios.get(`${apiUrl}/api/get/weeklyzone2minutes/${currentAccount}`)).data[0];
        setWeeklyZone2Minutes(weeklyZone2Minutes);
        setIsLoggingMinutes(false);
      } else {
        toast.error("Error logging data", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setIsLoggingMinutes(false);
      }
    });
  }

  const tallyWeeklyMinutes = async () => {
    console.log('Tallying weekly minutes...');
    let weeklyZone2Minutes = (await Axios.get(`${apiUrl}/api/get/weeklyzone2minutes/${currentAccount}`)).data[0];
    if (weeklyZone2Minutes === null) {
      weeklyZone2Minutes = 0;
    }
    setWeeklyZone2Minutes(weeklyZone2Minutes);
    console.log(`Weekly zone 2 minutes set: ${weeklyZone2Minutes}`);
  }

  const getWeeklySessions = async () => {
    console.log('Getting weekly sessions...');
    let weeklySessions = (await Axios.get(`${apiUrl}/api/get/weeklysessions/${currentAccount}`)).data;
    let weeklySessionsCleaned = weeklySessions.map((session) => {
      const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      // return { day: weekday[new Date(session.created_at).getDay()], minutes: session.minutes, created_at: session.created_at }
      return { day: weekday[new Date(session.created_at).getDay()], minutes: session.minutes, id: session.id }
    });
    setWeeklySessions(weeklySessionsCleaned);
    console.log(`Weekly sessions set`);
  }

  // const checkLocalStorageForEmail = () => {
  //   console.log('Checking local storage for email...');
  //   return new Promise((resolve, reject) => {
  //     const email = localStorage.getItem('email');
  //     if (email) {
  //       console.log('Email located in local storage:', email);
  //       console.log('Updating current account')
  //       setCurrentAccount(email);
  //       console.log(currentAccount); //THIS IS THE CURRENT BUG, WHEN THIS RUNS, it's undefinded 
  //       //see: https://dev.to/shareef/react-usestate-hook-is-asynchronous-1hia
  //       resolve('Email located in local storage, user is now logged in');
  //     } else {
  //       console.log('User is not signed in');
  //       // reject('Email not found in local storage');
  //     }
  //   })
  // }

  const checkLocalStorageForEmail = () => {
    console.log('Checking local storage for email...');
    const email = localStorage.getItem('email');
    if (email) {
      console.log('Email located in local storage:', email);
      console.log('Updating current account')
      setCurrentAccount(email);
    } else {
      console.log('User is not signed in');
    }
  }


  const updateMinutesToLog = (direction) => {
    if (direction === 'increase') {
      setMinutesToLog(minutesToLog + 5);
    } else if (direction === 'decrease') {
      if (minutesToLog === 0) {
        setMinutesToLog(0);
      } else {
        setMinutesToLog(minutesToLog - 5);
      }
    }
  }

  const displayDropdown = () => {
    document.getElementById("myDropdown").classList.toggle("show");
  }

  const signOut = () => {
    console.log('Signing out...');
    localStorage.clear();
    setCurrentAccount(null);
    setWeeklyZone2Minutes('');
    setWeeklySessions([]);
  }

  const displayDeleteWeeklySessionModal = (rowToDelete) => {
    setIdOfRowInDatabaseToDelete(rowToDelete);
    setDisplayDeleteSessionModal(true);
  }

  const deleteSession = (idToDelete) => {
    console.log(`Deleting session with the folowing id: ${idToDelete}...`)
    setDisplayDeleteSessionModal(false);
    Axios.post(`${apiUrl}/api/deletesession`,
      {
        account: currentAccount,
        id: idToDelete
      }
    ).then((result) => {
      if (result.statusText === 'OK') {
        toast.success("Session Deleted!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        console.log(`Session with the folowing id has been deleted: ${idToDelete}`);
        tallyWeeklyMinutes();
      } else {
        toast.error("Error deleting session", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    })
  }

  //RENDER METHODS
  const renderSignInOrSignOutButton = () => {
    if (currentAccount) {
      return (
        <div className="dropdown">
          <button onClick={displayDropdown} className="dropbtn"><nobr><span className='email'>{currentAccount}<img alt="dropdown-icon" className='dropdown-icon' src={icon} /></span></nobr></button>
          <div id="myDropdown" className="dropdown-content">
            <div onClick={signOut}>Sign Out</div>
          </div>
        </div>
      )
    } else {
      return (
        <button onClick={async () => {
          await signInWithGoogle();
          checkLocalStorageForEmail();
        }} className='login-with-google-btn'><nobr>SIGN IN</nobr></button>
      )
    }
  }

  const renderNumberOfMinutesLogged = () => {
    return (
      <div className='weekly-minutes-logged'>
        <div className='minutes-to-add'>
          {/* {<h1>You logged <span className='number-of-zone-2-minutes-this-week'>{weeklyZone2Minutes}</span> out of the recommended 150-180 Zone 2 minutes this week</h1>} */}
          {currentAccount && <h1>You logged <span className='number-of-zone-2-minutes-this-week'>{weeklyZone2Minutes}</span> out of the recommended 150-180 Zone 2 minutes this week</h1>}
          {!currentAccount && <h1>Goal: Aim for 150-180 Zone 2 minutes per week</h1>}
        </div>
      </div>
    )
  }

  const renderLogMinutesContainer = () => {
    return (
      <div className='log-minutes-outer-container'>
        {<h1>{currentAccount ? 'Log more minutes' : 'Log your minutes'}</h1>}
        <div className='log-minutes-inner-container'>
          {renderUpArrow()}
          {renderMinutesToAdd()}
          {renderDownArrow()}
          {<button className='log-minutes-button' onClick={() => logMinutes(minutesToLog)}>LOG {minutesToLog} MINUTES</button>}
        </div>
      </div>
    )
  }

  const renderUpArrow = () => {
    return (
      <button className='arrow-button' onClick={() => updateMinutesToLog('increase')}>
        <div className="arrow-up" id='arrow'></div>
      </button>
    )
  }

  const renderMinutesToAdd = () => {
    return (
      <div className='minutes-to-log'>
        {minutesToLog}
      </div>
    )
  }

  const renderDownArrow = () => {
    return (
      <button className='arrow-button' onClick={() => updateMinutesToLog('decrease')}>
        <div className="arrow-down" id='arrow'></div>
      </button>
    )
  }

  const renderWeeklySessions = () => {
    if (currentAccount && weeklyZone2Minutes > 0) {
      return (
        <div className='weekly-sessions-outer-container'>
          <h1>Weekly Sessions</h1>
          <div className='weekly-sessions-header'>
            <div className='weekly-session-day'>
              Day
            </div>
            <div className='weekly-session-minutes'>
              Minutes
            </div>
          </div>
          <div className='weekly-sessions-container'>
            {weeklySessions.map((item, i) => {
              return <div id='weekly-session-card' key={i} value={item.id}>
                <div className='weekly-session-day'>
                  {item.day}
                </div>
                <div className='weekly-session-minutes-delete-container'>
                  <div className='weekly-session-minutes'>
                    {item.minutes}
                  </div>
                  <i className='material-icons' id='weekly-session-delete' onClick={(e) => {
                    let sessionToDelete = e.target.parentElement.parentElement.getAttribute('value');
                    displayDeleteWeeklySessionModal(sessionToDelete)
                  }}>clear</i>
                </div>
              </div>
            })}
          </div>
        </div>
      )
    }
  }

  const modalRef = useRef();

  const closeModal = (e) => {
    //modalRef.current is the div with class of 'container'
    if (e.target === modalRef.current) {
      setDisplayDeleteSessionModal(false);
      setDisplaySignInModal(false);
    }
  };

  const renderDeleteSessionModal = () => {
    if (displayDeleteSessionModal) {
      //a portal exists outside the DOM heirarchy of the parent component
      //takes 2 arguments: 1) content to render 2) where to render it 
      return ReactDom.createPortal(
        <div className="modal-container" ref={modalRef} onClick={closeModal}>
          <div className="modal">
            <h2>Are you sure you want to delete that session?</h2>
            <button className='x-button' onClick={() => setDisplayDeleteSessionModal(false)}>X</button>
            <button className='modal-delete-button' onClick={() => deleteSession(idOfRowInDatabaseToDelete)}>DELETE</button>
          </div>
        </div>,
        document.getElementById("modal")
      );
    }
  }

  const renderSignInModal = () => {
    if (displaySignInModal) {
      //a portal exists outside the DOM heirarchy of the parent component
      //takes 2 arguments: 1) content to render 2) where to render it 
      return ReactDom.createPortal(
        <div className="modal-container" ref={modalRef} onClick={closeModal}>
          <div className="modal">
            <h2>Please sign in to log a zone 2 cardio session</h2>
            <button className='x-button' onClick={() => setDisplaySignInModal(false)}>X</button>
            <button className='modal-sign-in-button' onClick={async () => {
              setDisplaySignInModal(false);
              setIsLoggingMinutes(true);
              await signInWithGoogle();
              checkLocalStorageForEmail();
            }
            }>SIGN IN</button>
          </div>
        </div>,
        document.getElementById("modal")
      );
    }
  }

  // USE EFFECTS
  useEffect(() => {
    checkLocalStorageForEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentAccount) {
      tallyWeeklyMinutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    if (isLoggingMinutes) {
      logMinutes(minutesToLog);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    if (weeklyZone2Minutes > 0) {
      getWeeklySessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyZone2Minutes]);

  return (
    <div className='outer-container'>
      <div className='main-container'>
        <div className='header'>
          <div className='logo'>ZONE 2 CARDIO TRACKER</div>
          {renderSignInOrSignOutButton()}
        </div>
        {renderNumberOfMinutesLogged()}
        {renderLogMinutesContainer()}
        {renderWeeklySessions()}
        {renderDeleteSessionModal()}
        {renderSignInModal()}
      </div>
      <ToastContainer
        position="top-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{ width: "265px", left: "40px" }}
      />
    </div>
  )
}

export default App;

