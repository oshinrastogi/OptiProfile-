import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/auth';

const AdminDashboard = () => {
    const [auth,setAuth] = useAuth();
    // const [categories, setCategories] = useState([]); // Commented out as backend doesn't support category filter for this endpoint
    // const [selectedCategory, setSelectedCategory] = useState('All'); // Commented out
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true); // Set to true initially to show loading on first render
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Initialize navigate

    const BACKEND_URL = import.meta.env.VITE_BACKEND_API;

    // Admin role check and redirection
    useEffect(() => {
        // Check if user is authenticated and has admin role (role 'admin' as string)
        if (!auth?.user || auth.user.role !== 1) {
            toast.error("Redirecting to login page...");
            navigate('/login'); // Redirect to login page
        }
    }, [auth, navigate]); // Depend on auth and navigate

    // Function to fetch candidates based on skill search query
    useEffect(() => {
        const fetchCandidates = async () => {
            // Only fetch if authenticated and admin
            if (!auth?.user || auth.user.role !== 1) {
                setLoading(false); // Stop loading if not authorized
                return;
            }

            setLoading(true);
            setError('');
            setCandidates([]); // Clear previous candidates before new fetch

            try {
                const token = auth.token; // Get token from auth context
                // if (!token) {
                //     toast.error('Authentication token missing. Please log in.');
                //     navigate('/login');
                //     return;
                // }

                // Construct URL and params for skill search
                const params = {};
                if (skillSearchQuery.trim()) {
                    params.skills = skillSearchQuery.trim(); // Backend expects 'skills' query param
                }

                // Corrected URL: /api/admin/candidates as per backend routes
                const response = await axios.get(`${BACKEND_URL}/api/v1/auth/candidates`, {
                    params: params,
                    headers: {
                        Authorization: `Bearer ${token}`, // Send JWT token
                    },
                    withCredentials: true // Keep if your backend uses cookies/sessions
                });

                if (response.data.success) {
                    setCandidates(response.data.candidates);
                    if (response.data.candidates.length === 0) {
                        // toast('No candidates found matching your criteria.');
                    } else {
                        // toast.success('Candidates fetched successfully!');
                    }
                } else {
                    setError(response.data.message || 'Failed to fetch candidates.');
                    // toast.error(response.data.message || 'Failed to fetch candidates.');
                }
            } catch (err) {
                console.error('Error fetching candidates:', err);
                if (err.response && err.response.status === 403) {
                    setError('Access Denied: You do not have admin privileges.');
                    toast.error('Access Denied: Admin privilege required.');
                    navigate('/'); 
                } else if (err.response && err.response.data && err.response.data.message) {
                    setError(err.response.data.message);
                    // toast.error(err.response.data.message);
                } else {
                    setError('Failed to fetch candidates. Please try again.');
                    // toast.error('Failed to fetch candidates.');
                }
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };

        // Trigger fetch when skillSearchQuery changes or auth state changes (after initial admin check)
        // Only fetch if the user is confirmed to be an admin (to avoid unnecessary fetches/errors)
        if (auth?.user?.role === 1) {
            fetchCandidates();
        } else {
            setLoading(false); // If not admin, stop loading state
        }
    }, [skillSearchQuery, auth, BACKEND_URL, navigate]); // Added navigate to dependencies

    // Render access denied message if not admin
    if (!auth?.user || auth.user.role !== 1) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <h1 className="text-2xl text-red-600">Access Denied: You are not an administrator.</h1>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
                <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
                    Admin <span className="text-blue-600">Dashboard</span>
                </h1>

                {error && <p className="text-red-600 text-center mb-4">{error}</p>}

                {/* Category Filter (Commented out as backend doesn't support it for this endpoint) */}
                {/*
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Filter by Job Category:</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setSkillSearchQuery(''); // Clear skill search when category changes
                                }}
                                className={`px-5 py-2 rounded-full font-medium transition-all duration-200
                                    ${selectedCategory === cat && !skillSearchQuery
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                */}

                {/* Skill Search Input */}
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Search by Skill:</h3>
                    <input
                        type="text"
                        value={skillSearchQuery}
                        onChange={(e) => {
                            setSkillSearchQuery(e.target.value);
                            // setSelectedCategory('All'); // Commented out
                        }}
                        placeholder="e.g., React, Node.js, MongoDB"
                        className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                </div>

                {/* Candidates List */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        Candidates: <span className="text-blue-600">
                            {skillSearchQuery ? `with "${skillSearchQuery}"` : 'All'} {/* Adjusted text */}
                        </span>
                    </h3>

                    {loading ? (
                        <p className="text-center text-blue-600 text-lg">Loading candidates...</p>
                    ) : candidates.length === 0 ? (
                        <p className="text-center text-gray-600 text-lg">
                            {skillSearchQuery ? `No candidates found matching "${skillSearchQuery}".` : 'No candidates found. Enter skills to search.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Candidate Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Highest ATS Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Matched Skills
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Updated
                                        </th>
                                        {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th> */}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {candidates.map((candidate) => (
                                        <tr key={candidate.userId}> {/* Corrected key to userId */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {candidate.userName} {/* Display userName */}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {candidate.userEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {candidate.highestAtsScore}% {/* Corrected to highestAtsScore */}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                                                {candidate.matchedSkills && candidate.matchedSkills.length > 0
                                                    ? candidate.matchedSkills.join(', ') // Corrected to matchedSkills
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(candidate.lastUpdated).toLocaleDateString()} {/* Corrected to lastUpdated */}
                                            </td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2">
                                                <a href={`mailto:${candidate.userEmail}`} className="text-blue-600 hover:text-blue-900">
                                                    Reach Out
                                                </a> */}
                                                {/* Removed View PDF link as pdfPath is not returned by backend */}
                                                {/* {candidate.pdfPath && (
                                                    <a
                                                        href={`${BACKEND_URL}/${candidate.pdfPath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-600 hover:text-purple-900 ml-2"
                                                    >
                                                        View PDF
                                                    </a>
                                                )} */}
                                            {/* </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;