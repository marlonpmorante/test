import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config';
import { User, Lock, Shield, Eye, EyeOff, XCircle } from 'lucide-react';

const AddUser = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('member'); // Default role
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [users, setUsers] = useState([]); // New state for list of users
    const [listMessage, setListMessage] = useState(''); // New state for message box for the list
    const [addedUserDetails, setAddedUserDetails] = useState(null); // New state to display added user info

    // Styles for the message box
    const messageBoxStyle = {
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '15px',
        fontWeight: 'bold',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.5s ease-out',
    };

    const successBoxStyle = {
        ...messageBoxStyle,
        backgroundColor: '#e6ffe6', // Light green
        color: '#006600', // Darker green
        border: '1px solid #a3e6a3',
    };

    const errorBoxStyle = {
        ...messageBoxStyle,
        backgroundColor: '#ffe6e6', // Light red
        color: '#cc0000', // Darker red
        border: '1px solid #e6a3a3',
    };

    const infoBoxStyle = {
        ...messageBoxStyle,
        backgroundColor: '#e6f7ff', // Light blue
        color: '#004085', // Darker blue
        border: '1px solid #a3d9ff',
    };

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    // Function to fetch users
    const fetchUsers = async () => {
        setListMessage('');
        try {
            const res = await fetch(apiUrl('/users')); // Assuming an endpoint to get all users
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
                if (data.length === 0) {
                    setListMessage('No users found.');
                }
            } else {
                setListMessage(`Error fetching users: ${data.message || 'Unknown error.'}`);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setListMessage('Server error while fetching users.');
        }
    };

    // useEffect to fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setAddedUserDetails(null); // Clear previous added user details

        if (!username.trim() || !password.trim()) {
            setMessage('Username and password are required.');
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch(apiUrl('/users'), {
               method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('User added successfully!');
                // Removed password from setAddedUserDetails for security
                setAddedUserDetails({ username, role }); // Set details of the newly added user
                setUsername('');
                setPassword('');
                setRole('member');
                fetchUsers();
            } else {
                setMessage(`${data.message || 'Failed to add user.'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Server error while adding user.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        setListMessage('');
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const res = await fetch(apiUrl(`/users/${userId}`), {
                method: 'DELETE',
            });

            if (res.ok) {
                setListMessage('User deleted successfully!');
                fetchUsers();
            } else {
                const data = await res.json();
                setListMessage(`Failed to delete user: ${data.message || 'Unknown error.'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setListMessage('Server error while deleting user.');
        }
    };

    // Inline styles moved to a style block at the bottom for better organization and to apply media queries
    return (
        <div className="add-user-container">
            {/* Add User Section */}
            <div className="add-user-section">
                <h2 className="section-title">
                    ➕ Add New User
                </h2>

                <form onSubmit={handleAddUser}>
                    {message && (
                        <div style={message.includes('successfully') ? successBoxStyle : errorBoxStyle}>
                            {message}
                        </div>
                    )}
                    {addedUserDetails && (
                        <div style={infoBoxStyle}>
                            <p><strong>Added User Details:</strong></p>
                            <p>Username: {addedUserDetails.username}</p>
                            <p>Role: {addedUserDetails.role}</p>
                        </div>
                    )}
                    <div className="input-group">
                        <User className="icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            disabled={isSubmitting}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            onFocus={(e) => e.currentTarget.parentNode.classList.add('focused')}
                            onBlur={(e) => e.currentTarget.parentNode.classList.remove('focused')}
                        />
                    </div>

                    <div className="input-group password-group">
                        <Lock className="icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            disabled={isSubmitting}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            onFocus={(e) => e.currentTarget.parentNode.classList.add('focused')}
                            onBlur={(e) => e.currentTarget.parentNode.classList.remove('focused')}
                        />
                        <span
                            onClick={togglePasswordVisibility}
                            className="password-toggle"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <div className="input-group">
                        <Shield className="icon" />
                        <select
                            value={role}
                            disabled={isSubmitting}
                            onChange={(e) => setRole(e.target.value)}
                            onFocus={(e) => e.currentTarget.parentNode.classList.add('focused')}
                            onBlur={(e) => e.currentTarget.parentNode.classList.remove('focused')}
                        >
                            <option value="member">Pharmacist</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="submit-button"
                    >
                        {isSubmitting ? 'Adding...' : 'Add User'}
                    </button>
                </form>
            </div>

            {/* User List Section */}
            <div className="user-list-section">
                <h2 className="section-title">
                    👥 User List
                </h2>
                {listMessage && (
                    <div style={
                        listMessage.includes('successfully') || listMessage.includes('No users found')
                            ? successBoxStyle
                            : errorBoxStyle
                    }>
                        {listMessage}
                    </div>
                )}
                {users.length > 0 ? (
                    <ul className="user-list">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className="user-list-item"
                            >
                                <div>
                                    <strong className="username">{user.username}</strong>{' '}
                                    <span className="user-role">({user.role})</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="delete-button"
                                >
                                    <XCircle size={20} />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !listMessage && <p className="loading-message">Loading users...</p>
                )}
            </div>
            <style jsx>{`
                .add-user-container {
                    max-width: 900px;
                    margin: 40px auto;
                    padding: 30px;
                    background-color: #f0f2f5;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    display: flex;
                    gap: 40px;
                    font-family: Arial, sans-serif;
                    flex-wrap: wrap; /* Allow wrapping on smaller screens */
                }

                .add-user-section, .user-list-section {
                    flex: 1;
                    padding: 0 20px;
                    min-width: 300px; /* Ensure sections don't get too small */
                }

                .user-list-section {
                    border-left: 1px solid #e0e0e0;
                    padding-left: 40px;
                }

                @media (max-width: 768px) {
                    .add-user-container {
                        flex-direction: column;
                        padding: 20px;
                        margin: 20px;
                    }

                    .add-user-section, .user-list-section {
                        padding: 0;
                        border-left: none;
                        padding-left: 0;
                    }

                    .user-list-section {
                        margin-top: 30px;
                        border-top: 1px solid #e0e0e0;
                        padding-top: 30px;
                    }
                }

                .section-title {
                    text-align: center;
                    margin-bottom: 30px;
                    color: #333;
                    font-size: 28px;
                    border-bottom: 2px solid #ccc;
                    padding-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .input-group {
                    display: flex;
                    align-items: center;
                    border: 1px solid #ddd;
                    border-radius: 25px;
                    padding: 12px 20px;
                    margin-bottom: 18px;
                    background-color: #ffffff;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                }

                .input-group.focused {
                    border-color: #88b4ff;
                    box-shadow: 0 2px 8px rgba(0,123,255,0.2);
                }

                .input-group input,
                .input-group select {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 16px;
                    padding: 0; /* Remove default padding */
                }

                .input-group select {
                    appearance: none; /* Remove default select arrow */
                    padding-right: 20px; /* Space for custom arrow if needed */
                }

                .icon {
                    margin-right: 12px;
                    color: #6c757d;
                }

                .password-group {
                    position: relative;
                }

                .password-toggle {
                    position: absolute;
                    right: 20px;
                    cursor: pointer;
                    color: #6c757d;
                    display: flex;
                    align-items: center;
                }

                .submit-button {
                    width: 100%;
                    padding: 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 25px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
                    box-shadow: 0 4px 10px rgba(0,123,255,0.3);
                }

                .submit-button:hover:not(:disabled) {
                    background-color: #0056b3;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,123,255,0.4);
                }

                .submit-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .user-list {
                    list-style: none;
                    padding: 0;
                }

                .user-list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    margin-bottom: 12px;
                    background-color: #ffffff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                }

                .user-list-item:hover {
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }

                .username {
                    color: #333;
                    font-size: 1.1em;
                }

                .user-role {
                    font-size: 0.95em;
                    color: #666;
                    margin-left: 8px;
                    padding: 4px 8px;
                    border-radius: 5px;
                    background-color: #e9ecef;
                }

                .delete-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #dc3545;
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }

                .delete-button:hover {
                    background-color: #f8d7da;
                    transform: scale(1.1);
                }

                .loading-message {
                    text-align: center;
                    color: #777;
                    font-style: italic;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AddUser;