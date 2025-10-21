// src/components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import BackgroundImage from '../assets/background.jpg'; //
import LogoImage from '../assets/logo.png';       //

const LoginForm = ({ onLogin }) => { //
  const [username, setUsername] = useState(''); //
  const [password, setPassword] = useState(''); //
  const [error, setError] = useState(''); //
  const [isSubmitting, setIsSubmitting] = useState(false); //
  const [showPassword, setShowPassword] = useState(false); //
  const [messageBox, setMessageBox] = useState({ //
    isVisible: false, //
    type: '', //
    message: '', //
  });
  const navigate = useNavigate(); //

  const handleLogin = async (e) => { //
    e.preventDefault(); //
    setError(''); //
    setMessageBox({ isVisible: false, type: '', message: '' }); //
    setIsSubmitting(true); //

    try {
      const response = await fetch(apiUrl('/login'), { //
        method: 'POST', //
        headers: { //
          'Content-Type': 'application/json', //
        },
        body: JSON.stringify({ username, password }), //
      });

      const data = await response.json(); //

      if (response.ok) { //
        setMessageBox({ //
          isVisible: true, //
          type: 'success', //
          message: '✅ Login successful', //
        });

        // **IMPORTANT: Extract userRole and username from the backend response**
        const loggedInUsername = data.user ? data.user.username : username;
        const rawRole = data.user ? data.user.role : 'member';
        const userRole = rawRole === 'admin' ? 'admin' : 'member'; // Normalize any non-admin to 'member'

        setTimeout(() => {
          onLogin(userRole, loggedInUsername); // Pass the role and username to the onLogin callback
          if (userRole === 'admin') {
            navigate('/'); // Redirect admin to home/dashboard (InventoryForm)
          } else {
            navigate('/'); // Redirect regular members to home (InventoryForm)
          }
        }, 1500);

      } else {
        setError(data.message || 'Invalid username or password'); //
        setMessageBox({ //
          isVisible: true, //
          type: 'error', //
          message: data.message || 'Invalid username or password', //
        });
      }
    } catch (err) {
      console.error('Login error:', err); //
      setError('An unexpected error occurred.'); //
      setMessageBox({ //
        isVisible: true, //
        type: 'error', //
        message: 'An unexpected error occurred.', //
      });
    } finally {
      setIsSubmitting(false); //
    }
  };

  const closeMessageBox = () => { //
    setMessageBox({ isVisible: false, type: '', message: '' }); //
  };

  return (
    <div style={{ /* cite: 2 */
      fontFamily: 'sans-serif', /* cite: 2 */
      display: 'flex', /* cite: 2 */
      justifyContent: 'center', /* cite: 2 */
      alignItems: 'center', /* cite: 2 */
      minHeight: '100vh', /* cite: 2 */
      background: '#e0f2f7', /* cite: 2 */
    }}>
      <div style={{ /* cite: 2 */
        width: '80%', /* cite: 2 */
        maxWidth: '960px', /* cite: 2 */
        height: '600px', /* cite: 2 */
        backgroundColor: '#fff', /* cite: 2 */
        borderRadius: '10px', /* cite: 2 */
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', /* cite: 2 */
        display: 'flex', /* cite: 2 */
        overflow: 'hidden', /* cite: 2 */
        position: 'relative', /* cite: 2 */
      }}>
        <div style={{ /* cite: 2 */
          flex: 1, /* cite: 2 */
          background: `linear-gradient(135deg, #a7ffeb 0%, rgb(3, 8, 8) 100%), url(${BackgroundImage})`, /* cite: 2 */
          backgroundBlendMode: 'overlay', /* cite: 2 */
          backgroundSize: 'cover', /* cite: 2 */
          backgroundPosition: 'center', /* cite: 2 */
        }}></div>

        <div style={{ /* cite: 2 */
          flex: 1, /* cite: 2 */
          display: 'flex', /* cite: 2 */
          flexDirection: 'column', /* cite: 2 */
          justifyContent: 'center', /* cite: 2 */
          alignItems: 'center', /* cite: 2 */
          padding: '40px', /* cite: 2 */
        }}>
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <img src={LogoImage} alt="App logo" style={{ maxWidth: '190px', maxHeight: '190px', marginBottom: '-50px' }} />
          </div>
          <h2 style={{ color: '#00bcd4', marginBottom: '30px' }}>Welcome</h2> {/* cite: 2 */}
          <form onSubmit={handleLogin} style={{ width: '80%', maxWidth: '300px' }}> {/* cite: 2 */}
            <div style={{ marginBottom: '20px', position: 'relative' }}> {/* cite: 2 */}
              <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', color: '#757575' }}> {/* cite: 2 */}
                Username
              </label>
              <FaUser style={{ /* cite: 2 */
                position: 'absolute', /* cite: 2 */
                left: '10px', /* cite: 2 */
                top: '38px', /* cite: 2 */
                color: '#757575', /* cite: 2 */
                pointerEvents: 'none', /* cite: 2 */
              }} />
              <input
                type="text" /* cite: 2 */
                id="username" /* cite: 2 */
                value={username} /* cite: 2 */
                onChange={(e) => setUsername(e.target.value)} /* cite: 2 */
                placeholder="Enter username" /* cite: 2 */
                required /* cite: 2 */
                style={{ /* cite: 2 */
                  width: '88%', /* cite: 2 */
                  padding: '12px 12px 12px 36px', /* cite: 2 */
                  borderRadius: '8px', /* cite: 2 */
                  border: '1px solid #ccc', /* cite: 2 */
                  fontSize: '1em', /* cite: 2 */
                }}
              />
            </div>
            <div style={{ marginBottom: '20px', position: 'relative' }}> {/* cite: 2 */}
              <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: '#757575' }}> {/* cite: 2 */}
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ /* cite: 2 */
                  position: 'absolute', /* cite: 2 */
                  left: '10px', /* cite: 2 */
                  top: '50%', /* cite: 2 */
                  transform: 'translateY(-50%)', /* cite: 2 */
                  color: '#757575', /* cite: 2 */
                  pointerEvents: 'none', /* cite: 2 */
                }} />
                <input
                  type={showPassword ? 'text' : 'password'} /* cite: 2 */
                  id="password" /* cite: 2 */
                  value={password} /* cite: 2 */
                  onChange={(e) => setPassword(e.target.value)} /* cite: 2 */
                  placeholder="********" /* cite: 2 */
                  required /* cite: 2 */
                  style={{ /* cite: 2 */
                    width: '80%', /* cite: 2 */
                    padding: '12px 40px 12px 36px', /* cite: 2 */
                    borderRadius: '8px', /* cite: 2 */
                    border: '1px solid #ccc', /* cite: 2 */
                    fontSize: '1em', /* cite: 2 */
                  }}
                />
                <button
                  type="button" /* cite: 2 */
                  onClick={() => setShowPassword(!showPassword)} /* cite: 2 */
                  style={{ /* cite: 2 */
                    position: 'absolute', /* cite: 2 */
                    right: '-10px', /* cite: 2 */
                    top: '50%', /* cite: 2 */
                    transform: 'translateY(-50%)', /* cite: 2 */
                    background: 'none', /* cite: 2 */
                    border: 'none', /* cite: 2 */
                    cursor: 'pointer', /* cite: 2 */
                    fontSize: '1.2em', /* cite: 2 */
                    color: '#757575', /* cite: 2 */
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />} {/* cite: 2 */}
                </button>
              </div>
            </div>
            {error && ( /* cite: 2 */
              <p style={{ color: '#e53935', marginBottom: '6px' }}> {/* cite: 2 */}
                {error}
              </p>
            )}
            <button
              type="submit" /* cite: 2 */
              disabled={isSubmitting} /* cite: 2 */
              style={{ /* cite: 2 */
                backgroundColor: '#1e88e5', /* cite: 2 */
                color: 'white', /* cite: 2 */
                padding: '14px 20px', /* cite: 2 */
                border: 'none', /* cite: 2 */
                borderRadius: '25px', /* cite: 2 */
                cursor: 'pointer', /* cite: 2 */
                fontSize: '1.1em', /* cite: 2 */
                width: '106%', /* cite: 2 */
                transition: 'background-color 0.3s ease', /* cite: 2 */
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'} /* cite: 2 */
              onMouseOut={(e) => e.target.style.backgroundColor = '#1e88e5'} /* cite: 2 */
            >
              {isSubmitting ? 'Logging in...' : 'Login'} {/* cite: 2 */}
            </button>
          </form>
        </div>
      </div>

      {messageBox.isVisible && ( /* cite: 2 */
        <div style={{ /* cite: 2 */
          position: 'fixed', /* cite: 2 */
          top: 0, /* cite: 2 */
          left: 0, /* cite: 2 */
          right: 0, /* cite: 2 */
          bottom: 0, /* cite: 2 */
          backgroundColor: 'rgba(0, 0, 0, 0.5)', /* cite: 2 */
          display: 'flex', /* cite: 2 */
          justifyContent: 'center', /* cite: 2 */
          alignItems: 'center', /* cite: 2 */
          zIndex: 1000, /* cite: 2 */
        }}>
          <div style={{ /* cite: 2 */
            backgroundColor: 'white', /* cite: 2 */
            padding: '30px', /* cite: 2 */
            borderRadius: '10px', /* cite: 2 */
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)', /* cite: 2 */
            textAlign: 'center', /* cite: 2 */
            maxWidth: '400px', /* cite: 2 */
            width: '90%', /* cite: 2 */
            position: 'relative', /* cite: 2 */
            border: messageBox.type === 'success' ? '2px solid #4CAF50' : '2px solid #F44336', /* cite: 2 */
          }}>
            <h3 style={{ /* cite: 2 */
              color: messageBox.type === 'success' ? '#4CAF50' : '#F44336', /* cite: 2 */
              marginBottom: '20px', /* cite: 2 */
              fontSize: '1.5em', /* cite: 2 */
            }}>
              {messageBox.type === 'success' ? 'Success!' : 'Error!'} {/* cite: 2 */}
            </h3>
            <p style={{ marginBottom: '20px', fontSize: '1.1em', color: '#333' }}> {/* cite: 2 */}
              {messageBox.message}
            </p>
            <button
              onClick={closeMessageBox} /* cite: 2 */
              style={{ /* cite: 2 */
                backgroundColor: messageBox.type === 'success' ? '#4CAF50' : '#F44336', /* cite: 2 */
                color: 'white', /* cite: 2 */
                padding: '10px 20px', /* cite: 2 */
                border: 'none', /* cite: 2 */
                borderRadius: '5px', /* cite: 2 */
                cursor: 'pointer', /* cite: 2 */
                fontSize: '1em', /* cite: 2 */
                transition: 'background-color 0.3s ease', /* cite: 2 */
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = messageBox.type === 'success' ? '#45a049' : '#d32f2f'} /* cite: 2 */
              onMouseOut={(e) => e.target.style.backgroundColor = messageBox.type === 'success' ? '#4CAF50' : '#F44336'} /* cite: 2 */
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
